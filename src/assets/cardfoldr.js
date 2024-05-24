const { pdfjsLib } = globalThis;
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

const toPageSelection = (selected, pageCount) => {
    let last = null, rangeStart = null;
    const output = [];
    for (const page of selected) {
        if (last) {
            if (last + 1 === page) {
                // in sequence
                if (!rangeStart) {
                    rangeStart = last;
                }

            } else {
                // end of sequence
                if (rangeStart) {
                    // active range
                    if (rangeStart === 1) {
                        // range starting at 1
                        output.push("-" + last);
                    } else {
                        output.push(rangeStart + "-" + last);
                    }
                    rangeStart = null;
                } else {
                    output.push(last);
                }
            }
        }

        last = page;
    }

    if (rangeStart) {
        if (rangeStart === 1 && last === pageCount) {
            // full range
            return "";
        } else if (last === pageCount) {
            // range ending at last page
            output.push(rangeStart + "-");
        } else {
            output.push(rangeStart + "-" + last);
        }
    } else {
        output.push(last);
    }

    return output.join(", ");
}

// --- PDF rendering ---

let _currentScale;

const updatePageSelection = (which) => {
    if (which === "pdf" && pdf) {
        const pagesContainer = document.getElementById('pages');
        const selectedPages = Array.from(pagesContainer.querySelectorAll('.page:not(.excluded)')).map(x => parseInt(x.id.split('-')[1]));
        document.getElementById('pageSelection').value = toPageSelection(selectedPages, pdf.numPages);
    } else if (which === "background" && backgroundPdf) {
        const backgroundContainer = document.getElementById('pages-back');
        const selectedBackgroundPages = Array.from(backgroundContainer.querySelectorAll('.page:not(.excluded)')).map(x => parseInt(x.id.split('-')[2]));
        document.getElementById('backgroundPageSelection').value = toPageSelection(selectedBackgroundPages, backgroundPdf ? backgroundPdf.numPages : 0);
    }
}

const drawGrid = (ctx, countX, countY, width, height, startX, startY, marginX, marginY, cutMargin, mmFactor) => {
    // draw card grid
    const drawCardGrid = () => {
        for (let x = 0; x <= countX; x++) {
            for (let y = 0; y <= countY; y++) {
                // verticals
                const gridX = (startX + x * width + (x > 0 ? (x - 1) * marginX : 0)) / mmFactor;
                ctx.moveTo(gridX, 0);
                ctx.lineTo(gridX, ctx.canvas.height);
    
                if (marginX > 0 && x > 0 && x < countX) {
                    ctx.moveTo(gridX + marginX / mmFactor, 0);
                    ctx.lineTo(gridX + marginX / mmFactor, ctx.canvas.height);
                }
    
                // horizontals
                const gridY = (startY + y * height + (y > 0 ? (y - 1) * marginY : 0)) / mmFactor;
                ctx.moveTo(0, gridY);
                ctx.lineTo(ctx.canvas.width, gridY);
    
                if (marginY > 0 && y > 0 && y < countY) {
                    ctx.moveTo(0, gridY + marginY / mmFactor);
                    ctx.lineTo(ctx.canvas.width, gridY + marginY / mmFactor);
                }
            }
        }
    }

    ctx.beginPath();
    ctx.lineWidth = 0.4 / mmFactor;
    ctx.strokeStyle = 'red';
    ctx.setLineDash([10, 10])
    drawCardGrid();
    ctx.stroke();

    // draw cut margin
    if (cutMargin > 0) {
        const drawCutMargin = () => {
            for (let x = 0; x < countX; x++) {
                for (let y = 0; y < countY; y++) {
                    const rectX = startX + x * width + x * marginX + cutMargin;
                    const rectY = startY + y * height + y * marginY + cutMargin;
                    ctx.rect(rectX / mmFactor, rectY / mmFactor, (width - 2 * cutMargin) / mmFactor, (height - 2 * cutMargin) / mmFactor);
                }
            }
        }

        ctx.beginPath();
        ctx.lineWidth = 0.4 / mmFactor;
        ctx.strokeStyle = 'blue';
        ctx.setLineDash([5, 5]);
        drawCutMargin();
        ctx.stroke();
    }
}

const drawPage = async (page, scale) => {
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    return canvas;
}

const refreshPageSelection = async () => {
    if (!pdf) {
        return;
    }

    const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);
    const backgroundPageSelection = parsePageSelection(document.getElementById('backgroundPageSelection').value, backgroundPdf ? backgroundPdf.numPages : 0);

    const pagesContainer = document.getElementById('pages');
    const backgroundContainer = document.getElementById('pages-back');

    for (const page of pagesContainer.querySelectorAll('.page')) {
        const p = parseInt(page.id.split('-')[1]);
        if (pageSelection.includes(p)) {
            page.classList.remove("excluded");
        } else {
            page.classList.add("excluded");
        }
    }

    for (const page of backgroundContainer.querySelectorAll('.page')) {
        const p = parseInt(page.id.split('-')[2]);
        if (backgroundPageSelection.includes(p)) {
            page.classList.remove("excluded");
        } else {
            page.classList.add("excluded");
        }
    }
}

const refreshGrid = async () => {
    const countX = parseInt(document.getElementById('countX').value);
    const countY = parseInt(document.getElementById('countY').value);
    const startX = parseFloat(document.getElementById('startX').value);
    const startY = parseFloat(document.getElementById('startY').value);
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const marginX = parseFloat(document.getElementById('marginX').value);
    const marginY = parseFloat(document.getElementById('marginY').value);
    const cutMargin = parseFloat(document.getElementById('cutMargin').value);
    
    const scale = parseFloat(document.getElementById('scale').value) / 100;
    if (_currentScale !== scale) {
        _currentScale = scale;
        await refreshPdf();
    } else {
        const frontCanvases = document.querySelectorAll("#pages .grid-container canvas");
        const backCanvases = document.querySelectorAll("#pages-back .grid-container canvas");

        for (const canvas of [...frontCanvases, ...backCanvases]) {
            const mmFactor = parseFloat(canvas.getAttribute("mm-factor"));
            const ctx = canvas.getContext('2d');
            ctx.reset();
            drawGrid(ctx, countX, countY, width, height, startX, startY, marginX, marginY, cutMargin, mmFactor);
        }

        refreshPageSelection();
    }
};

const refreshPdf = async () => {
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

    const scale = parseFloat(document.getElementById('scale').value) / 100;
    _currentScale = scale;

    clearPages();

    const pagesContainer = document.getElementById('pages');
    const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);
    const backgroundPageSelection = parsePageSelection(document.getElementById('backgroundPageSelection').value, backgroundPdf ? backgroundPdf.numPages : 0);

    const coordinateHelp = "Mouse over the pages to see the coordinates of the cursor here";
    document.getElementById('coordinates').textContent = coordinateHelp;

    const renderPages = async (pdfDoc, container, id, prefix, included) => {
        for (let p = 1; p <= pdfDoc.numPages; p++) {
            const page = await pdfDoc.getPage(p);
            const viewport = page.getViewport({ scale });
            const mmFactor = page.userUnit / 72 * 25.4 / scale;

            const canvas = await drawPage(page, scale);
            const pageUri = canvas.toDataURL("image/jpeg");

            const pageElement = document.createElement('div');
            pageElement.id = `${id}-${p}`;
            pageElement.classList = "page" + (included == null || included.includes(p) ? "" : " excluded");

            const pageImage = document.createElement('img');
            pageImage.src = pageUri;

            const gridCanvas = document.createElement('canvas');
            gridCanvas.height = canvas.height;
            gridCanvas.width = canvas.width;
            gridCanvas.setAttribute("mm-factor", mmFactor);

            drawGrid(gridCanvas.getContext('2d'), countX, countY, width, height, startX, startY, marginX, marginY, cutMargin, mmFactor);

            gridCanvas.addEventListener("mousemove", (event) => {
                const startX = parseFloat(document.getElementById('startX').value);
                const startY = parseFloat(document.getElementById('startY').value);

                const rect = event.target.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const xCoord = roundValue(x * mmFactor, 1);
                const yCoord = roundValue(y * mmFactor, 1);
                const xDist = roundValue(xCoord - startX, 1);
                const yDist = roundValue(yCoord - startY, 1);

                document.getElementById('coordinates').textContent = `Mouse at ${xCoord} x ${yCoord} mm (${xDist} x ${yDist} mm from start)`;
            });
            gridCanvas.addEventListener("mouseleave", () => {
                document.getElementById('coordinates').textContent = coordinateHelp;
            });

            const gridContainer = document.createElement('div');
            gridContainer.className = "grid-container";
            gridContainer.appendChild(pageImage);
            gridContainer.appendChild(gridCanvas);

            const toggleExcluded = () => {
                pageInfoTop.parentElement.classList.toggle("excluded");
                updatePageSelection(container.id === 'pages' ? "pdf" : "background");
            }

            const pageInfoTop = document.createElement('div');
            pageInfoTop.classList = "page-info";
            pageInfoTop.textContent = `${prefix}${p}/${pdfDoc.numPages}: ${roundValue(viewport.width * mmFactor, 1)} x ${roundValue(viewport.height * mmFactor, 1)} mm`;
            pageInfoTop.addEventListener("click", toggleExcluded);

            const pageInfoBottom = pageInfoTop.cloneNode(true);
            pageInfoBottom.addEventListener("click", toggleExcluded);

            pageElement.appendChild(pageInfoTop);
            pageElement.appendChild(gridContainer);
            pageElement.appendChild(pageInfoBottom);
            container.appendChild(pageElement);

        }
    }

    renderPages(pdf, pagesContainer, "page", "Page ", pageSelection);
    if (backgroundPdf) {
        const backgroundPagesContainer = document.getElementById('pages-back');
        renderPages(backgroundPdf, backgroundPagesContainer, "background-page", "Backs page ", backgroundPageSelection);
    }
}

// --- Card extraction ---

const clearCards = () => {
    const cardsContainer = document.getElementById('cards');
    while (cardsContainer.firstChild) {
        cardsContainer.removeChild(cardsContainer.firstChild);
    }
    document.getElementById('card-output').textContent = "";
    document.getElementById('generate').disabled = true;
}

const updateDeckInfo = (count, excluded) => {
    document.getElementById('card-output').textContent = `Extracted ${count} cards, ${excluded} of which are excluded, making for a total of ${count - excluded} cards to be included.`;
}

const rotateImage180 = async (image) => {
    const img = new Image();
    img.src = image;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.translate(img.width / 2, img.height / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";
    const src = canvas.toDataURL(mimeType);
    return src;
}

const extractCards = async () => {
    if (!pdf) return;
    const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);
    const backgroundPageSelection = parsePageSelection(document.getElementById('backgroundPageSelection').value, backgroundPdf ? backgroundPdf.numPages : 0);

    const countX = parseInt(document.getElementById('countX').value);
    const countY = parseInt(document.getElementById('countY').value);
    const startX = parseFloat(document.getElementById('startX').value);
    const startY = parseFloat(document.getElementById('startY').value);
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const marginX = parseFloat(document.getElementById('marginX').value);
    const marginY = parseFloat(document.getElementById('marginY').value);

    const backLoc = document.getElementById('backs').value;
    const rotateBacks = document.getElementById('rotateBacks').checked;
    const optimizeFor = document.getElementById('optimize').value;

    const scale = 4;
    const orientationClass = (width > height) ? "landscape" : "portrait";

    clearCards();

    const cardsContainer = document.getElementById('cards');
    const mimeType = optimizeFor === "quality" ? "image/png" : "image/jpeg";

    let expectedTotal;
    if (backLoc === "lastpage") {
        expectedTotal = countX * countY * (pageSelection.length - 1);
    } else if (backLoc === "file" || backLoc === "fileall") {
        expectedTotal = countX * countY * pageSelection.length;
    } else if (backLoc === "duplex" || backLoc === "duplex2") {
        expectedTotal = countX * countY * Math.ceil(pageSelection.length / 2);
    }

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
                cardImage.src = canvas.toDataURL(mimeType);
                cardImage.className = "front";
                cardImage.style = `aspect-ratio: ${width} / ${height}`;

                const backImage = document.createElement('img');
                backImage.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                backImage.className = "back";
                backImage.style = `aspect-ratio: ${width} / ${height}`;

                const cardInfo = document.createElement('div');
                cardInfo.classList = "card-info";
                cardInfo.textContent = `Card ${count}/${expectedTotal}`;

                const cardElement = document.createElement('div');
                cardElement.id = `card-${count}`;
                cardElement.classList = `card ${orientationClass}`;
                cardElement.addEventListener("click", () => {
                    cardElement.classList.toggle("excluded");
                    updateDeckInfo(count - 1, document.querySelectorAll('.card.excluded').length);
                });

                cardElement.appendChild(cardInfo);
                cardElement.appendChild(cardImage);
                cardElement.appendChild(backImage);
                cardElement.appendChild(cardInfo.cloneNode(true));

                cardsContainer.appendChild(cardElement);

                count++;
            }
        }
    }

    if (backLoc === "lastpage" || backLoc === "file") {
        let backsPage;
        if (backLoc === "lastpage") {
            backsPage = await pdf.getPage(pageSelection[pageSelection.length - 1]);
        } else {
            backsPage = await backgroundPdf.getPage(backgroundPageSelection[0]);
        }
        const mmFactor = backsPage.userUnit / 72 * 25.4 / scale;
        const viewport = backsPage.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.height = height / mmFactor;
        canvas.width = width / mmFactor;

        const ctx = canvas.getContext('2d');
        ctx.translate(-1 * startX / mmFactor, -1 * startY / mmFactor);

        await backsPage.render({ canvasContext: ctx, viewport }).promise;

        const src = rotateBacks ? await rotateImage180(canvas.toDataURL(mimeType)) : canvas.toDataURL(mimeType);

        for (let i = 1; i < count; i++) {
            const cardImage = document.getElementById(`card-${i}`).getElementsByClassName('back')[0];
            cardImage.src = src;
        }
    } else if (backLoc === "fileall") {
        let backCount = 1;
        for (let p = 0; p < backgroundPageSelection.length; p++) {
            const backPage = await backgroundPdf.getPage(backgroundPageSelection[p]);
            const mmFactor = backPage.userUnit / 72 * 25.4 / scale;
            const viewport = backPage.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            canvas.height = height / mmFactor;
            canvas.width = width / mmFactor;

            const ctx = canvas.getContext('2d');
            ctx.translate(-1 * startX / mmFactor, -1 * startY / mmFactor);
    
            await backPage.render({ canvasContext: ctx, viewport }).promise;

            const cardImage = document.getElementById(`card-${backCount}`).getElementsByClassName('back')[0];
            cardImage.src = rotateBacks ? await rotateImage180(canvas.toDataURL(mimeType)) : canvas.toDataURL(mimeType);

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

                        const cardImage = document.getElementById(`card-${backCount}`).getElementsByClassName('back')[0];
                        cardImage.src = rotateBacks ? await rotateImage180(canvas.toDataURL(mimeType)) : canvas.toDataURL(mimeType);
                        
                        backCount++;
                    }
                }
            } else {
                for (let y = countY - 1; y >= 0; y--) {
                    for (let x = 0; x < countX; x++) {
                        const canvas = document.createElement('canvas');
                        canvas.height = height / mmFactor;
                        canvas.width = width / mmFactor;

                        const ctx = canvas.getContext('2d');
                        ctx.rotate(Math.PI);
                        ctx.translate((startX + x * width + x * marginX) / mmFactor, (startY + y * height + y * marginY) / mmFactor);

                        await backPage.render({ canvasContext: ctx, viewport }).promise;

                        const cardImage = document.getElementById(`card-${backCount}`).getElementsByClassName('back')[0];
                        cardImage.src = rotateBacks ? await rotateImage180(canvas.toDataURL(mimeType)) : canvas.toDataURL(mimeType);
                        
                        backCount++;
                    }
                }
            }
        }
    }

    updateDeckInfo(count - 1, document.querySelectorAll('.card.excluded').length);
}

// --- PDF generation ---

const clearOutput = () => {
    const outputContainer = document.getElementById('output');
    while (outputContainer.firstChild) {
        outputContainer.removeChild(outputContainer.firstChild);
    }
    document.getElementById('generate-output').textContent = "";
}

const humanFileSize = (bytes) => {
    const units = ['B', 'KB', 'MB'];

    let factor = 1;
    let unit = units.shift();
    while (bytes >= factor * 1024 && units.length > 0) {
        unit = units.shift();
        factor *= 1024;
    }

    return `${(bytes / factor).toFixed(2)} ${unit}`;
}

const generatePdf = async () => {
    const promise = new Promise(async (resolve, reject) => {
        const pageSize = document.getElementById('pageSize').value;
        const cardWidth = parseFloat(document.getElementById('width').value);
        const cardHeight = parseFloat(document.getElementById('height').value);
        const cardMargin = parseFloat(document.getElementById('cardMargin').value);
        const cutMargin = parseFloat(document.getElementById('cutMargin').value);
        const foldingMargin = parseFloat(document.getElementById('foldingMargin').value);
        const printerMargin = parseFloat(document.getElementById('printerMargin').value);
        const cutterOffset = parseFloat(document.getElementById('cutterOffset').value);
        const foldLine = document.getElementById('foldLine').value;

        const foldLineEdge = document.getElementById('foldLineEdge').value;
        const downloadFilename = document.getElementById('downloadFilename').value;

        const generateLog = document.getElementById('generate-output');
        generateLog.textContent = "Collecting cards...";

        const cards = [];
        for (const cardElement of document.querySelectorAll('.card:not(.excluded)')) {
            const frontImageElement = cardElement.getElementsByClassName('front')[0];
            const backImageElement = cardElement.getElementsByClassName('back')[0];

            const frontImage = foldLineEdge === "top" ? await rotateImage180(frontImageElement.src) : frontImageElement.src;
            const backImage = foldLineEdge === "top" ? await rotateImage180(backImageElement.src) : backImageElement.src;

            cards.push({ front: frontImage, back: backImage });
        }

        const worker = new Worker('./assets/worker.js');
        worker.onmessage = async (e) => {
            if (e.data.state) {
                const { state, data } = e.data;

                switch (state) {
                    case "progress": {
                        const { done, all, progress } = data;
                        generateLog.textContent = `Adding card ${done}/${all}... (${progress}%)`;
                        break;
                    }
                    case "saving": {
                        generateLog.textContent = "Compiling PDF...";
                        break;
                    }
                    case "done": {
                        const { cards, pages, bytes } = data;
                        generateLog.textContent = `PDF compiled! Generated ${pages} pages for ${cards} cards, file size is ${humanFileSize(bytes)}.`;
                        break;
                    }
                }

            } else if (e.data.pdf) {
                const { pdfBytes, aspectRatio } = e.data.pdf;
                const pdfUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));

                // add download link
                const downloadName = downloadFilename ? downloadFilename : (pdfname ? pdfname.replace(/\.pdf$/i, ".foldable.pdf") : "cards.foldable.pdf");
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
                const iframeHeight = roundValue(iframeWidth / aspectRatio);
                iframe.src = pdfUrl;
                iframe.width = `${iframeWidth}px`;
                iframe.height = `${iframeHeight}px`;
                document.getElementById('output').appendChild(iframe);
                
                resolve();
            }
        }
        worker.onerror = (e) => {
            console.error(e.message, e.filename, e.lineno, e.colno, e.error);
            generateLog.textContent = "Error generating PDF!";
            reject(e);
        }

        const title = `CardFoldr version of ${pdfname}`;
        worker.postMessage({
            generatePdf: {
                cards: cards,
                options: {
                    cardWidth,
                    cardHeight,

                    cardMargin,
                    cutMargin,
                    foldingMargin,
                    printerMargin,
                    cutterOffset,

                    pageSize,
                    foldLine,
                    title,
                }
            }
        });
    });

    return promise;
}

// --- Presets ---

const generatePresetData = () => {
    const data = {};
    document.querySelectorAll('[data-preset]').forEach(element => {
        data[element.getAttribute('data-preset')] = element.type === "checkbox" ? element.checked : element.value;
    });
    return data;
}

const applyPresetData = (data) => {
    for (const key in data) {
        const element = document.querySelector(`[data-preset="${key}"]`);
        if (element) {
            if (element.type === "checkbox") {
                element.checked = data[key];
            } else {
                element.value = data[key];
            }
        }
    }
}

const toStorageKey = (key) => {
    return `preset-${key}`;
}

const keyFromName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]/ig, '-');
}

const loadPreset = async (key) => {
    const data = _getPreset(toStorageKey(key));
    if (data) {
        applyPresetData(data);
    }
    document.getElementById("updatePreset").disabled = true;
    await refreshGrid();
}

const savePreset = (key, name) => {
    const data = generatePresetData();
    data["_key"] = key;
    data["_name"] = name;

    localStorage.setItem(toStorageKey(key), JSON.stringify(data));
}

const updatePreset = (key) => {
    const preset = _getPreset(toStorageKey(key));
    if (preset === null) {
        return;
    }

    savePreset(key, preset["_name"]);
    document.getElementById("updatePreset").disabled = true;
}

const deletePreset = (key) => {
    localStorage.removeItem(toStorageKey(key));
}

const _getPreset = (key) => {
    const data = localStorage.getItem(key);
    if (data) {
        return JSON.parse(data);
    }
    return null;
}

const getAllPresets = () => {
    const keys = Object.keys(localStorage).filter(x => x.startsWith("preset-"));

    // sort by name
    keys.sort((a, b) => {
        const nameA = JSON.parse(localStorage.getItem(a))["_name"];
        const nameB = JSON.parse(localStorage.getItem(b))["_name"];
        return nameA.localeCompare(nameB);
    });

    return keys.map(x => JSON.parse(localStorage.getItem(x)));
}

const refreshPresetList = (key) => {
    const presets = getAllPresets();
    const presetSelect = document.getElementById("preset");
    while (presetSelect.firstChild) {
        presetSelect.removeChild(presetSelect.firstChild);
    }

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Custom...";
    if (!key || key === "") {
        defaultOption.selected = true;
    }
    presetSelect.appendChild(defaultOption);

    for (const preset of presets) {
        const option = document.createElement("option");
        option.value = preset["_key"];
        option.textContent = preset["_name"];
        if (key === preset["_key"]) {
            option.selected = true;
        }
        presetSelect.appendChild(option);
    }
}

document.querySelectorAll('[data-preset]').forEach(element => {
    element.addEventListener('change', () => {
        document.getElementById("updatePreset").disabled = false;
    });
});

document.getElementById("preset").addEventListener("change", async (event) => {
    const key = event.target.value;
    if (key === "") {
        document.getElementById("deletePreset").disabled = true;
        return;
    }

    document.getElementById("deletePreset").disabled = false;
    await loadPreset(key);
    syncQueryParams();
});

document.getElementById("saveNewPreset").addEventListener("click", (event) => {
    const presetName = prompt("Please enter a name for the preset");
    if (presetName) {
        const key = keyFromName(presetName);
        savePreset(key, presetName);
        refreshPresetList(key);
    }
});

document.getElementById("updatePreset").addEventListener("click", (event) => {
    const key = document.getElementById("preset").value;
    if (key === "") {
        return;
    }
    updatePreset(key);
});

document.getElementById("deletePreset").addEventListener("click", (event) => {
    const key = document.getElementById("preset").value;
    if (key === "") {
        return;
    }

    if (confirm("Are you sure you want to delete this preset?")) {
        deletePreset(key);
        refreshPresetList();
    }
});

// --- Event listeners ---

const syncQueryParams = () => {
    history.replaceState(null, "", "?" + generateQuery());
}

const onStepSizeChange = (event) => {
    const stepSize = document.getElementById("stepSize").value
    const gridValues = document.getElementsByClassName("grid-value");
    for (const element of gridValues) {
        element.setAttribute("step", stepSize);
    }
}

const generateQuery = () => {
    const query = new URLSearchParams();
    document.querySelectorAll('[data-query]').forEach(element => {
        query.set(element.getAttribute('data-query'), element.type === "checkbox" ? element.checked : element.value);
    });
    return query.toString();
}

document.getElementById("stepSize").addEventListener("change", (event) => {
    onStepSizeChange();
})

for (const element of document.getElementsByClassName("grid-definition")) {
    element.addEventListener('change', async () => { await refreshGrid() });
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
    document.getElementById("downloadFilename").value = pdfname.replace(/\.pdf$/i, ".foldable.pdf");
    await refreshPdf();
}

document.getElementById('file').addEventListener('change', async (event) => {
    await onPdfChange(event);

    if (document.getElementById("autoExtract").checked) {
        document.getElementById('extractCards').click();
    }
});

const onBackgroundPdfChange = async (event) => {
    backgroundPdf = null;
    clearCards();
    clearOutput();

    if (!event || !event.target || !event.target.files || !event.target.files[0]) {
        return;
    }
    backgroundPdf = await pdfjsLib.getDocument(URL.createObjectURL(event.target.files[0])).promise;
    await refreshPdf();
}

document.getElementById('background').addEventListener('change', async (event) => {
    await onBackgroundPdfChange(event);
});

document.getElementById('remove-background').addEventListener('click', async () => {
    document.getElementById('background').value = null;
    await onBackgroundPdfChange();
    await refreshPdf();
});

document.getElementById('refresh').addEventListener('click', async () => {
    if (!pdf) {
        alert("Please select a file for the cards first");
        return;
    }
    clearCards();
    clearOutput();
    await refreshGrid();

    if (document.getElementById("autoExtract").checked) {
        document.getElementById('extractCards').click();
    }
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
    if (backLoc === "fileall") {
        const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);
        const backgroundPageSelection = parsePageSelection(document.getElementById('backgroundPageSelection').value, backgroundPdf.numPages);
    
        if (pageSelection.length !== backgroundPageSelection.length) {
            alert("The number of (selected) pages in the card file and the card background file must match");
            return;
        }
    }
    if ((backLoc === "duplex" || backLoc === "duplex2")) {
        const pageSelection = parsePageSelection(document.getElementById('pageSelection').value, pdf.numPages);
        
        if (pageSelection.length % 2 !== 0) {
            alert("The number of pages in the card file must be even to use duplex mode for card backs");
            return;
        }
    }

    clearOutput();

    document.getElementById("extractCards").getElementsByClassName("fa")[0].classList = "fa fa-spinner fa-spin";

    window.setTimeout(async () => {
        await extractCards();
        document.getElementById('generate').disabled = false;
        document.getElementById("extractCards").getElementsByClassName("fa")[0].classList = "fa fa-gear";

        if (document.getElementById("autoGenerate").checked) {
            document.getElementById('generate').click();
        }
    }, 100);
});

document.getElementById('generate').addEventListener('click', async () => {
    document.getElementById('generate').getElementsByClassName("fa")[0].classList = "fa fa-spinner fa-spin";

    const cards = document.getElementsByClassName('card');
    if (cards.length === 0) {
        alert("Please extract the cards first");
        return;
    }

    clearOutput();

    window.setTimeout(async () => {
        await generatePdf();
        document.getElementById('generate').getElementsByClassName("fa")[0].classList = "fa fa-flag-checkered";
    }, 100);
});

window.onload = async () => {
    // pre-fill from query parameters
    for (const [key, value] of (new URL(document.location.toString()).searchParams)) {
        const element = document.querySelector(`[data-query="${key}"]`);
        if (element) {
            if (element.type === "checkbox") {
                element.checked = value === "true";
            } else {
                element.value = value;
            }
        }
    };

    // sync query parameters
    document.querySelectorAll('[data-query]').forEach(element => {
        element.addEventListener('change', () => {
            syncQueryParams();
        });
    });
    

    // sync step size
    onStepSizeChange();

    // load source PDF
    const fileElement = document.getElementById('file');
    if (fileElement && fileElement.value) {
        await onPdfChange({ target: fileElement });
    }

    // load back PDF
    const backgroundElement = document.getElementById('background');
    if (backgroundElement && backgroundElement.value) {
        await onBackgroundPdfChange({ target: backgroundElement });
    }

    // add horizontal scrolling
    for (const element of document.getElementsByClassName("scroll-horizontal")) {
        element.addEventListener('wheel', (event) => {
            const scrollAmount = parseInt(element.getAttribute('scroll-amount')) || 100;
            if (event.deltaY !== 0) {
                element.scrollLeft += event.deltaY > 0 ? scrollAmount : -scrollAmount;
            }
            event.preventDefault();
        });
    }

    // load presets
    refreshPresetList();

    // load and fill in version
    try {
        const versionInfo = await fetch("./version.json");
        const versionData = await versionInfo.json();

        const versionElement = document.createElement("span");
        versionElement.innerHTML = versionData.commit && versionData.build && versionData.date ? `Build #${versionData.build} of commit ${versionData.commit.substring(0, 8)}` : "Local build";

        const footerElement = document.getElementsByTagName("footer")[0];
        footerElement.appendChild(versionElement);
    } catch (e) {
        console.error("Error loading version information", e);
    }
};