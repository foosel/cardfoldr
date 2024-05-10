const { pdfjsLib, PDFLib } = globalThis;
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdf-js/pdf.worker.mjs';

let pdf = null;
let backgroundPdf = null;
let pdfname = null;

const roundValue = (value, digits) => {
    digits = digits || 0;
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}

const clearPages = () => {
    const pagesContainer = document.getElementById('pages');
    while (pagesContainer.firstChild) {
        pagesContainer.removeChild(pagesContainer.firstChild);
    }
    const backgroundContainer = document.getElementById('pages-back');
    while (backgroundContainer.firstChild) {
        backgroundContainer.removeChild(backgroundContainer.firstChild);
    }
}

const parsePageSelection = (pageSelection, pageCount) => {
    if (!pageSelection) {
        return Array.from({ length: pageCount }, (_, i) => i + 1);
    }

    let pages = [];
    for (const page of pageSelection.split(',')) {
        const p = page.trim();
        if (p.includes("-")) {
            const parts = p.split('-').map(x => x.trim());

            let first = parts[0] === "" ? 1 : parseInt(parts[0]);
            let last = parts[1] === "" ? pageCount : parseInt(parts[1]);
            if (first > last) {
                const tmp = first;
                first = last;
                last = tmp;
            }
            pages = pages.concat(Array.from({ length: last - first + 1 }, (_, i) => i + first));
        } else {
            pages.push(parseInt(p));
        }
    }

    return pages.filter(x => x >= 1 && x <= pageCount);
}

// --- PDF rendering ---

const refresh = async () => {
    if (!pdf) {
        return;
    }

    const countX = parseInt(document.getElementById('countX').value);
    const countY = parseInt(document.getElementById('countY').value);
    const startX = parseFloat(document.getElementById('startX').value);
    const startY = parseFloat(document.getElementById('startY').value);
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const marginX = parseFloat(document.getElementById('marginX').value);
    const marginY = parseFloat(document.getElementById('marginY').value);
    const cutMargin = parseFloat(document.getElementById('cutMargin').value);
    const scale = parseFloat(document.getElementById('scale').value);

    clearPages();

    const pagesContainer = document.getElementById('pages');
    const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);

    const coordinateHelp = "Mouse over the pages to see the coordinates of the cursor here";
    document.getElementById('coordinates').textContent = coordinateHelp;

    const drawPage = async (page) => {
        const viewport = page.getViewport({ scale });
        const mmFactor = page.userUnit / 72 * 25.4 / scale;

        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // draw card grid
        ctx.beginPath();
        ctx.lineWidth = 0.4 / mmFactor;
        ctx.strokeStyle = 'red';
        ctx.setLineDash([5, 5]);
        ctx.rect(startX / mmFactor, startY / mmFactor, (width * countX + marginX * (countX - 1)) / mmFactor, (height * countY + marginY * (countY - 1)) / mmFactor);
        for (let x = 1; x < countX; x++) {
            for (let y = 1; y < countY; y++) {
                // verticals
                ctx.moveTo((startX + x * width + (x - 1) * marginX) / mmFactor, startY / mmFactor);
                ctx.lineTo((startX + x * width + (x - 1) * marginX) / mmFactor, (startY + countY * height + marginY * (countY - 1)) / mmFactor);

                if (marginX > 0) {
                    ctx.moveTo((startX + x * width + x * marginX) / mmFactor, startY / mmFactor);
                    ctx.lineTo((startX + x * width + x * marginX) / mmFactor, (startY + countY * height + marginY * (countY - 1)) / mmFactor);
                }

                // horizontals
                ctx.moveTo(startX / mmFactor, (startY + y * height + (y - 1) * marginY) / mmFactor);
                ctx.lineTo((startX + countX * width + marginX * (countX - 1)) / mmFactor, (startY + y * height + (y - 1) * marginY) / mmFactor);

                if (marginY > 0) {
                    ctx.moveTo(startX / mmFactor, (startY + y * height + y * marginY) / mmFactor);
                    ctx.lineTo((startX + countX * width + marginX * (countX - 1)) / mmFactor, (startY + y * height + y * marginY) / mmFactor);
                }
            }
        }
        ctx.stroke();

        // draw cut margin
        if (cutMargin > 0) {
            ctx.beginPath();
            ctx.lineWidth = 0.4 / mmFactor;
            ctx.strokeStyle = 'blue';
            ctx.setLineDash([5, 5]);
            for (let x = 0; x < countX; x++) {
                for (let y = 0; y < countY; y++) {
                    const rectX = startX + x * width + x * marginX + cutMargin;
                    const rectY = startY + y * height + y * marginY + cutMargin;
                    ctx.rect(rectX / mmFactor, rectY / mmFactor, (width - 2 * cutMargin) / mmFactor, (height - 2 * cutMargin) / mmFactor);
                }
            }
            ctx.stroke();
        }

        return canvas;
    }

    const renderPages = async (pdfDoc, container, id, prefix, included) => {
        for (let p = 1; p <= pdfDoc.numPages; p++) {
            const page = await pdfDoc.getPage(p);
            const viewport = page.getViewport({ scale });
            const mmFactor = page.userUnit / 72 * 25.4 / scale;

            const canvas = await drawPage(page);

            const pageElement = document.createElement('div');
            pageElement.id = `${id}-${p}`;
            pageElement.classList = "page" + (included == null || included.includes(p) ? "" : " excluded");

            const pageInfo = document.createElement('caption');
            pageInfo.classList = "page-info";
            pageInfo.textContent = `${prefix}${p}/${pdfDoc.numPages}: ${roundValue(viewport.width * mmFactor, 1)} x ${roundValue(viewport.height * mmFactor, 1)} mm`;

            pageElement.appendChild(pageInfo);
            pageElement.appendChild(canvas);
            container.appendChild(pageElement);

            canvas.addEventListener("mousemove", (event) => {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const xCoord = roundValue(x * mmFactor, 1);
                const yCoord = roundValue(y * mmFactor, 1);
                const xDist = roundValue(xCoord - startX, 1);
                const yDist = roundValue(yCoord - startY, 1);

                document.getElementById('coordinates').textContent = `Mouse at ${xCoord} x ${yCoord} mm (${xDist} x ${yDist} mm from start)`;
            });
            canvas.addEventListener("mouseleave", () => {
                document.getElementById('coordinates').textContent = coordinateHelp;
            });
        }
    }

    renderPages(pdf, pagesContainer, "page", "Page ", pageSelection);
    if (backgroundPdf) {
        const backgroundPagesContainer = document.getElementById('pages-back');
        renderPages(backgroundPdf, backgroundPagesContainer, "background-page", "Backs page ");
    }
}

// --- Card extraction ---

const clearCards = () => {
    const cardsContainer = document.getElementById('cards');
    while (cardsContainer.firstChild) {
        cardsContainer.removeChild(cardsContainer.firstChild);
    }
    document.getElementById('card-output').textContent = "";
}

const extractCards = async () => {
    if (!pdf) return;
    const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);

    const countX = parseInt(document.getElementById('countX').value);
    const countY = parseInt(document.getElementById('countY').value);
    const startX = parseFloat(document.getElementById('startX').value);
    const startY = parseFloat(document.getElementById('startY').value);
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const marginX = parseFloat(document.getElementById('marginX').value);
    const marginY = parseFloat(document.getElementById('marginY').value);

    const backLoc = document.getElementById('backs').value;

    const scale = 4;
    const orientationClass = (width > height) ? "landscape" : "portrait";

    clearCards();

    const cardsContainer = document.getElementById('cards');

    let count = 1;
    for (let p = 0; p < (backLoc === "lastpage" ? pageSelection.length - 1 : pageSelection.length); p = p + ((backLoc === "duplex" || backLoc === "duplex2") ? 2 : 1)) {
        const page = await pdf.getPage(pageSelection[p]);
        const mmFactor = page.userUnit / 72 * 25.4 / scale;
        const viewport = page.getViewport({ scale: scale });

        for (let y = 0; y < countY; y++) {
            for (let x = 0; x < countX; x++) {
                const canvas = document.createElement('canvas');
                canvas.height = height / mmFactor;
                canvas.width = width / mmFactor;

                const ctx = canvas.getContext('2d');
                ctx.translate(-1 * (startX + x * width + x * marginX) / mmFactor, -1 * (startY + y * height + y * marginY) / mmFactor);
                await page.render({ canvasContext: ctx, viewport }).promise;

                const cardImage = document.createElement('img');
                cardImage.src = canvas.toDataURL();
                cardImage.className = "front";

                const cardElement = document.createElement('div');
                cardElement.id = `card-${count}`;
                cardElement.classList = `card ${orientationClass}`;
                cardElement.appendChild(cardImage);
                cardsContainer.appendChild(cardElement);

                count++;
            }
        }
    }
    document.getElementById('card-output').textContent = `Extracted ${count - 1} cards`;

    if (backLoc === "lastpage" || backLoc === "file") {
        let lastPage;
        if (backLoc === "lastpage") {
            lastPage = await pdf.getPage(pageSelection[pageSelection.length - 1]);
        } else {
            lastPage = await backgroundPdf.getPage(1);
        }
        const mmFactor = lastPage.userUnit / 72 * 25.4 / scale;
        const viewport = lastPage.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.height = height / mmFactor;
        canvas.width = width / mmFactor;

        const ctx = canvas.getContext('2d');
        ctx.translate(-1 * startX / mmFactor, -1 * startY / mmFactor);
        await lastPage.render({ canvasContext: ctx, viewport }).promise;

        for (let i = 1; i < count; i++) {
            const cardElement = document.getElementById(`card-${i}`);
            const cardImage = document.createElement('img');
            cardImage.src = canvas.toDataURL();
            cardImage.className = "back";
            cardElement.appendChild(cardImage);
        }
    } else if (backLoc === "fileall") {
        let backCount = 1;
        for (let p = 0; p < backgroundPdf.numPages; p++) {
            const backPage = await backgroundPdf.getPage(p + 1);
            const mmFactor = backPage.userUnit / 72 * 25.4 / scale;
            const viewport = backPage.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            canvas.height = height / mmFactor;
            canvas.width = width / mmFactor;

            const ctx = canvas.getContext('2d');
            ctx.translate(-1 * startX / mmFactor, -1 * startY / mmFactor);
            await backPage.render({ canvasContext: ctx, viewport }).promise;

            const cardImage = document.createElement('img');
            cardImage.src = canvas.toDataURL();
            cardImage.className = "back";

            const cardElement = document.getElementById(`card-${backCount}`);
            cardElement.appendChild(cardImage);

            backCount++;
        }
    } else if (backLoc === "duplex" || backLoc === "duplex2") {
        let backCount = 1;

        for (let p = 1; p < pageSelection.length; p = p + 2) {
            const backPage = await pdf.getPage(pageSelection[p]);
            const mmFactor = backPage.userUnit / 72 * 25.4 / scale;
            const viewport = backPage.getViewport({ scale: scale });

            if (backLoc === "duplex") {
                for (let y = 0; y < countY; y++) {
                    for (let x = countX - 1; x >= 0; x--) {
                        const canvas = document.createElement('canvas');
                        canvas.height = height / mmFactor;
                        canvas.width = width / mmFactor;

                        const ctx = canvas.getContext('2d');
                        ctx.translate(-1 * (startX + x * width + x * marginX) / mmFactor, -1 * (startY + y * height + y * marginY) / mmFactor);
                        await backPage.render({ canvasContext: ctx, viewport }).promise;

                        const cardImage = document.createElement('img');
                        cardImage.src = canvas.toDataURL();
                        cardImage.className = "back";

                        const cardElement = document.getElementById(`card-${backCount}`);
                        cardElement.appendChild(cardImage);

                        backCount++;
                    }
                }
            } else {
                for (let y = countY - 1; y >= 0; y--) {
                    for (let x = 0; x < countX; x++) {
                        const canvas = document.createElement('canvas');
                        canvas.className = "back";
                        canvas.height = height / mmFactor;
                        canvas.width = width / mmFactor;

                        const ctx = canvas.getContext('2d');
                        ctx.rotate(Math.PI);
                        ctx.translate((startX + x * width + x * marginX) / mmFactor, (startY + y * height + y * marginY) / mmFactor);
                        await backPage.render({ canvasContext: ctx, viewport }).promise;

                        const cardImage = document.createElement('img');
                        cardImage.src = canvas.toDataURL();
                        cardImage.className = "back";

                        const cardElement = document.getElementById(`card-${backCount}`);
                        cardElement.appendChild(cardImage);

                        backCount++;
                    }
                }
            }
        }
    }
}

// --- PDF generation ---

const clearOutput = () => {
    const outputContainer = document.getElementById('output');
    while (outputContainer.firstChild) {
        outputContainer.removeChild(outputContainer.firstChild);
    }
}

const insertMark = (page, x, y, options) => {
    const length = options.length || 2;
    const margin = options.margin || 1;
    const color = options.color || PDFLib.grayscale(0);
    const background = options.background || PDFLib.grayscale(1);
    const thickness = options.thickness || 0.4;
    const dashArray = options.dashArray || null;
    const parts = options.parts || "nesw";
    const mmFactor = options.mmFactor || (72 / 25.4);

    const lineOptions = {
        color: color,
        thickness: thickness,
    }
    if (dashArray) {
        lineOptions.dashArray = dashArray;
    }

    const backgroundOptions = {
        color: background,
        thickness: 3 * thickness,
    }

    for (const c of parts) {
        let start, end;
        switch (c) {
            case "n":
                start = { x: x, y: y + margin * mmFactor };
                end = { x: x, y: y + (margin + length) * mmFactor };
                break;
            case "e":
                start = { x: x + margin * mmFactor, y: y };
                end = { x: x + (margin + length) * mmFactor, y: y };
                break;
            case "s":
            start = { x: x, y: y - margin * mmFactor };
                end = { x: x, y: y - (margin + length) * mmFactor };
                break;
            case "w":
            start = { x: x - margin * mmFactor, y: y };
                end = { x: x - (margin + length) * mmFactor, y: y };
                break;
        }

        page.drawLine({ start, end, ...backgroundOptions });
        page.drawLine({ start, end, ...lineOptions });
    }
}

const drawMarkup = (page, orientation, rotate, pageWidth, pageHeight, cardWidth, cardHeight, totalWidth, totalHeight, cardMargin, foldingMargin, cutMargin, printerMargin, cardPerPage) => {
    if (!page) return;
    
    const mmFactor = 72 / 25.4;

    const cardWidthDoc = cardWidth * mmFactor;
    const cardHeightDoc = cardHeight * mmFactor;
    const cardMarginDoc = cardMargin * mmFactor;
    const foldingMarginDoc = foldingMargin * mmFactor;
    const cutMarginDoc = cutMargin * mmFactor;
    const printerMarginDoc = printerMargin * mmFactor;

    const unitWidthDoc = rotate ? cardHeightDoc : cardWidthDoc;
    const unitHeightDoc = rotate ? cardWidthDoc : cardHeightDoc;

    if (orientation === "vertical") {
        // fold line
        page.drawLine({
            start: { x: pageWidth / 2, y: printerMarginDoc },
            end: { x: pageWidth / 2, y: pageHeight - printerMarginDoc },
            thickness: 0.4,
            color: PDFLib.grayscale(0.7),
            dashArray: [5, 5],
        })

        // cut ticks
        const markX1 = pageWidth / 2 - foldingMarginDoc - unitWidthDoc + cutMarginDoc;
        const markX2 = pageWidth / 2 - foldingMarginDoc - cutMarginDoc;
        const markX3 = pageWidth / 2 + foldingMarginDoc + cutMarginDoc;
        const markX4 = pageWidth / 2 + foldingMarginDoc + unitWidthDoc - cutMarginDoc;

        for (let i = 0; i < cardPerPage; i++) {
            const partsLeft = (i === 0 || cardMargin && cutMargin) ? "nw" : "w";
            const partsRight = (i === 0 || cardMargin && cutMargin) ? "ne" : "e";
            const markY = (pageHeight + totalHeight) / 2 - i * (unitHeightDoc + cardMarginDoc) - cutMarginDoc;

            insertMark(page, markX1, markY, { parts: partsLeft });
            insertMark(page, markX2, markY, { parts: partsRight });
            insertMark(page, markX3, markY, { parts: partsLeft });
            insertMark(page, markX4, markY, { parts: partsRight });
            if (cardMargin > 0 && i < cardPerPage - 1) {
                const markY2 = markY - unitHeightDoc + 2 * cutMarginDoc;
                insertMark(page, markX1, markY2, { parts: cardMargin && cutMargin ? "sw" : "w"});
                insertMark(page, markX2, markY2, { parts: cardMargin && cutMargin ? "se" : "e"});
                insertMark(page, markX3, markY2, { parts: cardMargin && cutMargin ? "sw" : "w"});
                insertMark(page, markX4, markY2, { parts: cardMargin && cutMargin ? "se" : "e"});
            }
        }

        const finalMarkY = (pageHeight + totalHeight) / 2 - cardPerPage * (unitHeightDoc + cardMarginDoc) + cardMarginDoc + cutMarginDoc;
        insertMark(page, markX1, finalMarkY, { parts: "sw"});
        insertMark(page, markX2, finalMarkY, { parts: "se"});
        insertMark(page, markX3, finalMarkY, { parts: "sw"});
        insertMark(page, markX4, finalMarkY, { parts: "se"});
    } else {
        // fold line
        page.drawLine({
            start: { x: printerMarginDoc, y: pageHeight / 2 },
            end: { x: pageWidth - printerMarginDoc, y: pageHeight /2 },
            thickness: 0.4,
            color: PDFLib.grayscale(0.7),
            dashArray: [5, 5],
        })

        // cut ticks
        const markY1 = pageHeight / 2 + foldingMarginDoc + unitHeightDoc - cutMarginDoc;
        const markY2 = pageHeight / 2 + foldingMarginDoc + cutMarginDoc;
        const markY3 = pageHeight / 2 - foldingMarginDoc - cutMarginDoc;
        const markY4 = pageHeight / 2 - foldingMarginDoc - unitHeightDoc + cutMarginDoc;

        for (let i = 0; i < cardPerPage; i++) {
            const partsUp = (i === 0 || cardMargin && cutMargin) ? "nw" : "n";
            const partsDown = (i === 0 || cardMargin && cutMargin) ? "sw" : "s";
            const markX = (pageWidth - totalWidth) / 2 + i * (unitWidthDoc + cardMarginDoc) + cutMarginDoc;

            insertMark(page, markX, markY1, { parts: partsUp });
            insertMark(page, markX, markY2, { parts: partsDown });
            insertMark(page, markX, markY3, { parts: partsUp });
            insertMark(page, markX, markY4, { parts: partsDown });
            if (cardMargin > 0 && i < cardPerPage - 1) {
                const markX2 = markX + unitWidthDoc - 2 * cutMarginDoc;
                insertMark(page, markX2, markY1, { parts: cardMargin && cutMargin ? "ne" : "n"});
                insertMark(page, markX2, markY2, { parts: cardMargin && cutMargin ? "se" : "s"});
                insertMark(page, markX2, markY3, { parts: cardMargin && cutMargin ? "ne" : "n"});
                insertMark(page, markX2, markY4, { parts: cardMargin && cutMargin ? "se" : "s"});
            }
        }

        const finalMarkX = (pageWidth - totalWidth) / 2 + cardPerPage * (unitWidthDoc + cardMarginDoc) - cardMarginDoc - cutMarginDoc;
        insertMark(page, finalMarkX, markY1, { parts: "ne"});
        insertMark(page, finalMarkX, markY2, { parts: "se"});
        insertMark(page, finalMarkX, markY3, { parts: "ne"});
        insertMark(page, finalMarkX, markY4, { parts: "se"});
    }
}

const generatePdf = async () => {
    const pageSize = document.getElementById('pageSize').value;
    const cardWidth = parseFloat(document.getElementById('width').value);
    const cardHeight = parseFloat(document.getElementById('height').value);
    const cardMargin = parseFloat(document.getElementById('cardMargin').value);
    const cutMargin = parseFloat(document.getElementById('cutMargin').value);
    const foldingMargin = parseFloat(document.getElementById('foldingMargin').value);
    const printerMargin = parseFloat(document.getElementById('printerMargin').value);
    const foldLine = document.getElementById('foldLine').value;

    const generateLog = document.getElementById('generate-output');

    const pageFormat = PDFLib.PageSizes[pageSize];
    const pageAspectRatio = pageFormat[0] / pageFormat[1];

    const mmFactor = 72 / 25.4;
    const printerMarginDoc = printerMargin * mmFactor;

    const [pageWidth, pageHeight] = pageFormat;
    const [usableWidth, usableHeight] = [pageWidth - 2 * printerMarginDoc, pageHeight - 2 * printerMarginDoc];
    const [cardWidthDoc, cardHeightDoc] = [cardWidth * mmFactor, cardHeight * mmFactor];
    const cardMarginDoc = cardMargin * mmFactor;
    const foldingMarginDoc = foldingMargin * mmFactor;

    const usableHalf = foldLine === "vertical" ? (usableWidth / 2 - 2 * foldingMarginDoc) : (usableHeight / 2 - 2 * foldingMarginDoc);
    
    let maxCardsPerPage, rotate, totalHeight, totalWidth;
    if (foldLine === "vertical") {
        if (cardWidth < usableHalf && cardHeight < usableHalf) {
            // card fits on half of the page in both orientations, lets figure out how many cards we can fit
            const cardsPerPageWidth = Math.floor(usableHeight / (cardWidthDoc + cardMarginDoc));
            const cardsPerPageHeight = Math.floor(usableHeight / (cardHeightDoc + cardMarginDoc));
            console.log(cardsPerPageWidth, cardsPerPageHeight);

            if (cardsPerPageWidth < cardsPerPageHeight) {
                maxCardsPerPage = cardsPerPageHeight;
                rotate = false;
            } else {
                maxCardsPerPage = cardsPerPageWidth;
                rotate = true;
            }
        } else if (cardWidth < usableHalf) {
            // card fits on half of the page in width, but not height
            maxCardsPerPage = Math.floor(usableHeight / cardHeightDoc);
            rotate = false;
        } else if (cardHeight < usableHalf) {
            // card fits on half of the page in height, but not width
            maxCardsPerPage = Math.floor(usableWidth / cardWidthDoc);
            rotate = true;
        } else {
            // card does not fit on half of the page in either orientation
            alert("Cards are too large to fit on half of the page in either orientation");
            return;
        }

        console.log(maxCardsPerPage, rotate);

        const unitWidth = rotate ? cardHeightDoc : cardWidthDoc;
        const unitHeight = rotate ? cardWidthDoc : cardHeightDoc;
        totalHeight = maxCardsPerPage * unitHeight + (maxCardsPerPage - 1) * cardMargin * mmFactor;
        totalWidth = 2 * unitWidth + cardMargin * mmFactor;

        console.log(totalWidth, totalHeight);
    } else {
        if (cardWidth < usableHalf && cardHeight < usableHalf) {
            // card fits on half of the page in both orientations, lets figure out how many cards we can fit
            const cardsPerPageWidth = Math.floor(usableWidth / (cardWidthDoc + cardMarginDoc));
            const cardsPerPageHeight = Math.floor(usableWidth / (cardHeightDoc + cardMarginDoc));
            console.log(cardsPerPageWidth, cardsPerPageHeight);

            if (cardsPerPageWidth > cardsPerPageHeight) {
                maxCardsPerPage = cardsPerPageWidth;
                rotate = false;
            } else {
                maxCardsPerPage = cardsPerPageHeight;
                rotate = true;
            }
        } else if (cardWidth < usableHalf) {
            // card fits on half of the page in width, but not height
            maxCardsPerPage = Math.floor(usableWidth / cardWidthDoc);
            rotate = false;
        } else if (cardHeight < usableHalf) {
            // card fits on half of the page in height, but not width
            maxCardsPerPage = Math.floor(usableWidth / cardHeightDoc);
            rotate = true;
        } else {
            // card does not fit on half of the page in either orientation
            alert("Cards are too large to fit on half of the page in either orientation");
            return;
        }

        console.log(maxCardsPerPage, rotate);

        const unitWidth = rotate ? cardHeightDoc : cardWidthDoc;
        const unitHeight = rotate ? cardWidthDoc : cardHeightDoc;
        totalWidth = maxCardsPerPage * unitWidth + (maxCardsPerPage - 1) * cardMargin * mmFactor;
        totalHeight = 2 * unitHeight + cardMargin * mmFactor;

        console.log(totalWidth, totalHeight);
    }

    clearOutput();
    generateLog.textContent = `Generating...`;

    const url = "https://foosel.github.io/cardfoldr";
    const now = new Date();
    const pdfDoc = await PDFLib.PDFDocument.create();
    pdfDoc.setTitle(`CardFoldr version of ${pdfname}`);
    pdfDoc.setAuthor(url);
    pdfDoc.setProducer(url);
    pdfDoc.setCreator(`CardFoldr (${url})`);
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    const cards = document.getElementsByClassName('card');
    let count = 0;
    let pages = 0;
    let page = null;
    for (const cardElement of cards) {
        const frontImageElement = cardElement.getElementsByClassName('front')[0];
        const backImageElement = cardElement.getElementsByClassName('back')[0];

        const frontImage = await pdfDoc.embedPng(frontImageElement.src);
        const backImage = await pdfDoc.embedPng(backImageElement.src);

        if (page == null || count % maxCardsPerPage === 0) {
            drawMarkup(page, foldLine, rotate, pageWidth, pageHeight, cardWidth, cardHeight, totalWidth, totalHeight, cardMargin, foldingMargin, cutMargin, printerMargin, maxCardsPerPage);
            pages++;
            page = pdfDoc.addPage(pageFormat);
        }

        let xFront, yFront, xBack, yBack, angleFront, angleBack;
        if (foldLine === "vertical") {
            if (rotate) {
                angleFront = PDFLib.degrees(90);
                xFront = pageWidth / 2 - foldingMarginDoc;
                yFront = (pageHeight + totalHeight) / 2 - cardWidthDoc - (count % maxCardsPerPage) * (cardWidthDoc + cardMarginDoc);
    
                angleBack = PDFLib.degrees(-90);
                xBack = pageWidth / 2 + foldingMarginDoc;
                yBack = (pageHeight + totalHeight) / 2 - (count % maxCardsPerPage) * (cardWidthDoc + cardMarginDoc);

            } else {
                angleFront = PDFLib.degrees(0);
                xFront = pageWidth / 2 - foldingMarginDoc - cardWidthDoc;
                yFront = (pageHeight + totalHeight) / 2 - cardHeightDoc - (count % maxCardsPerPage) * (cardHeightDoc + cardMarginDoc);
    
                angleBack = PDFLib.degrees(0);
                xBack = pageWidth / 2 + foldingMarginDoc;
                yBack = yFront;
            }
        } else {
            if (!rotate) {
                angleFront = PDFLib.degrees(0);
                yFront = pageHeight / 2 + foldingMarginDoc;
                xFront = (pageWidth - totalWidth) / 2 + (count % maxCardsPerPage) * (cardWidthDoc + cardMarginDoc);
    
                angleBack = PDFLib.degrees(180);
                yBack = pageHeight / 2 - foldingMarginDoc;
                xBack = xFront + cardWidthDoc;

            } else {
                angleFront = PDFLib.degrees(90);
                yFront = pageHeight / 2 + foldingMarginDoc;
                xFront = (pageWidth - totalWidth) / 2 + cardHeightDoc + (count % maxCardsPerPage) * (cardHeightDoc + cardMarginDoc);
    
                angleBack = PDFLib.degrees(90);
                yBack = pageHeight / 2 - foldingMarginDoc - cardWidthDoc;
                xBack = xFront
            }
        }

        page.drawImage(frontImage, {
            x: xFront,
            y: yFront,
            width: cardWidthDoc,
            height: cardHeightDoc,
            rotate: angleFront,
        });

        page.drawImage(backImage, {
            x: xBack,
            y: yBack,
            width: cardWidthDoc,
            height: cardHeightDoc,
            rotate: angleBack,
        });

        count++;
        generateLog.textContent = `Generating... (${count}/${cards.length})`;
    }
    drawMarkup(page, foldLine, rotate, pageWidth, pageHeight, cardWidth, cardHeight, totalWidth, totalHeight, cardMargin, foldingMargin, cutMargin, printerMargin, maxCardsPerPage);

    const pdfBytes = await pdfDoc.save();
    const pdfUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));

    // add download link
    const downloadName = pdfname ? pdfname.replace(/\.pdf$/i, ".foldable.pdf") : "cards.foldable.pdf";
    const downloadLink = document.createElement('a');
    downloadLink.id = 'download-button';
    downloadLink.href = pdfUrl;
    downloadLink.download = downloadName;
    downloadLink.textContent = ' Download PDF';
    downloadLink.classList = "pure-button pure-button-primary";
    const downloadIcon = document.createElement('i');
    downloadIcon.classList = "fas fa-download";
    downloadLink.prepend(downloadIcon);
    document.getElementById('output').appendChild(downloadLink);

    // add iframe
    const iframe = document.createElement('iframe');
    const iframeWidth = 900;
    const iframeHeight = roundValue(iframeWidth / pageAspectRatio);
    iframe.src = pdfUrl;
    iframe.width = `${iframeWidth}px`;
    iframe.height = `${iframeHeight}px`;
    document.getElementById('output').appendChild(iframe);
    
    generateLog.textContent = `Generated ${pages} pages with ${cards.length} cards`;
}

const onPdfChange = async (event) => {
    pdf = null;
    clearCards();
    clearOutput();

    if (!event || !event.target || !event.target.files || !event.target.files[0]) {
        return;
    }
    pdfname = event.target.files[0].name;
    pdf = await pdfjsLib.getDocument(URL.createObjectURL(event.target.files[0])).promise;
    await refresh();
}

document.getElementById('file').addEventListener('change', async (event) => {
    await onPdfChange(event);
});

const onBackgroundPdfChange = async (event) => {
    backgroundPdf = null;
    clearCards();
    clearOutput();

    if (!event || !event.target || !event.target.files || !event.target.files[0]) {
        return;
    }
    backgroundPdf = await pdfjsLib.getDocument(URL.createObjectURL(event.target.files[0])).promise;
    await refresh();
}

document.getElementById('background').addEventListener('change', async (event) => {
    await onBackgroundPdfChange(event);
});

document.getElementById('remove-background').addEventListener('click', async () => {
    document.getElementById('background').value = null;
    await onBackgroundPdfChange();
    await refresh();
});

document.getElementById('refresh').addEventListener('click', async () => {
    if (!pdf) {
        alert("Please select a file for the cards first");
        return;
    }
    await refresh();
});

document.getElementById('extractCards').addEventListener('click', async () => {
    if (!pdf) {
        alert("Please select a file for the cards first");
        return;
    }

    const backLoc = document.getElementById('backs').value;
    if ((backLoc === "file" || backLoc === "fileall") && !backgroundPdf) {
        alert("Please select a background file to use for the card backs");
        return;
    }
    if (backLoc === "fileall" && pdf.pages.length !== backgroundPdf.pages.length) {
        alert("The number of pages in the card file and the card background file must match");
        return;
    }
    if ((backLoc === "duplex" || backLoc === "duplex2") && pdf.numPages % 2 !== 0){
        alert("The number of pages in the card file must be even to use duplex mode for card backs");
        return;
    }

    await extractCards();
});

document.getElementById('generate').addEventListener('click', async () => {
    const cards = document.getElementsByClassName('card');
    if (cards.length === 0) {
        alert("Please extract the cards first");
        return;
    }

    document.getElementById('generate').getElementsByClassName("fa")[0].classList = "fa fa-spinner fa-spin";

    window.setTimeout(async () => {
        await generatePdf();
        document.getElementById('generate').getElementsByClassName("fa")[0].classList = "fa fa-flag-checkered";
    }, 100);
});

window.onload = async () => {
    const fileElement = document.getElementById('file');
    if (fileElement && fileElement.value) {
        await onPdfChange({ target: fileElement });
    }

    const backgroundElement = document.getElementById('background');
    if (backgroundElement && backgroundElement.value) {
        await onBackgroundPdfChange({ target: backgroundElement });
    }
};