if (typeof importScripts === "function") {
    importScripts("./pdf-lib/pdf-lib.min.js");

    const withDefault = (value, defaultValue) => {
        return value !== undefined ? value : defaultValue;
    }

    const validated = (value, check, defaultValue) => {
        if (!check(value)) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error("Invalid value: " + value);
        }
        return value;
    }

    const insertMark = (page, x, y, options) => {
        const length = withDefault(options.length, 2);
        const margin = withDefault(options.margin, 1);
        const color = withDefault(options.color, PDFLib.grayscale(0));
        const background = withDefault(options.background, PDFLib.grayscale(1));
        const offset = withDefault(options.offset, PDFLib.grayscale(0.5));
        const thickness = withDefault(options.thickness, 0.4);
        const dashArray = withDefault(options.dashArray, null);
        const parts = withDefault(options.parts, "nesw");
        const cutterOffset = withDefault(options.cutterOffset, 0);
        const mmFactor = withDefault(options.mmFactor, (72 / 25.4));
    
        const offsetOptions = {
            color: offset,
            thickness: cutterOffset * 2
        }
    
        const lineOptions = {
            color: color,
            thickness: thickness,
        }
        if (dashArray) {
            lineOptions.dashArray = dashArray;
        }
    
        const backgroundOptions = {
            color: background,
            thickness: cutterOffset ? ((cutterOffset + thickness) * 2) : (3 * thickness),
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
            if (cutterOffset) {
                page.drawLine({ start, end, ...offsetOptions });
            }
            page.drawLine({ start, end, ...lineOptions });
        }
    }
    
    const drawMarkup = (page, orientation, rotate, pageWidth, pageHeight, cardWidth, cardHeight, totalWidth, totalHeight, cardMargin, foldingMargin, cutMargin, printerMargin, cutterOffset, cardPerPage) => {
        if (!page) return;
        
        const mmFactor = 72 / 25.4;
    
        const cardWidthDoc = cardWidth * mmFactor;
        const cardHeightDoc = cardHeight * mmFactor;
        const cardMarginDoc = cardMargin * mmFactor;
        const foldingMarginDoc = foldingMargin * mmFactor;
        const cutMarginDoc = cutMargin * mmFactor;
        const printerMarginDoc = printerMargin * mmFactor;
        const cutterOffsetDoc = cutterOffset * mmFactor;
    
        const unitWidthDoc = rotate ? cardHeightDoc : cardWidthDoc;
        const unitHeightDoc = rotate ? cardWidthDoc : cardHeightDoc;
    
        if (orientation === "vertical") {
            // fold line
            page.drawLine({
                start: { x: pageWidth / 2, y: printerMarginDoc },
                end: { x: pageWidth / 2, y: pageHeight - printerMarginDoc },
                thickness: 0.4,
                color: PDFLib.grayscale(0.5),
                dashArray: [5, 5],
            })
    
            // cut ticks
            const tickOptions = {
                cutterOffset: cutterOffsetDoc
            }
    
            const markX1 = pageWidth / 2 - foldingMarginDoc - unitWidthDoc + cutMarginDoc;
            const markX2 = pageWidth / 2 - foldingMarginDoc - cutMarginDoc;
            const markX3 = pageWidth / 2 + foldingMarginDoc + cutMarginDoc;
            const markX4 = pageWidth / 2 + foldingMarginDoc + unitWidthDoc - cutMarginDoc;
    
            for (let i = 0; i < cardPerPage; i++) {
                const partsLeft = (i === 0 || cardMargin && cutMargin) ? "nw" : "w";
                const partsRight = (i === 0 || cardMargin && cutMargin) ? "ne" : "e";
                const markY = (pageHeight + totalHeight) / 2 - i * (unitHeightDoc + cardMarginDoc) - cutMarginDoc;
    
                insertMark(page, markX1, markY, { parts: partsLeft, ...tickOptions });
                insertMark(page, markX2, markY, { parts: partsRight, ...tickOptions });
                insertMark(page, markX3, markY, { parts: partsLeft, ...tickOptions });
                insertMark(page, markX4, markY, { parts: partsRight, ...tickOptions });
                if (cardMargin > 0 && i < cardPerPage - 1) {
                    const markY2 = markY - unitHeightDoc + 2 * cutMarginDoc;
                    insertMark(page, markX1, markY2, { parts: cardMargin && cutMargin ? "sw" : "w", ...tickOptions});
                    insertMark(page, markX2, markY2, { parts: cardMargin && cutMargin ? "se" : "e", ...tickOptions});
                    insertMark(page, markX3, markY2, { parts: cardMargin && cutMargin ? "sw" : "w", ...tickOptions});
                    insertMark(page, markX4, markY2, { parts: cardMargin && cutMargin ? "se" : "e", ...tickOptions});
                }
            }
    
            const finalMarkY = (pageHeight + totalHeight) / 2 - cardPerPage * (unitHeightDoc + cardMarginDoc) + cardMarginDoc + cutMarginDoc;
            insertMark(page, markX1, finalMarkY, { parts: "sw", ...tickOptions});
            insertMark(page, markX2, finalMarkY, { parts: "se", ...tickOptions});
            insertMark(page, markX3, finalMarkY, { parts: "sw", ...tickOptions});
            insertMark(page, markX4, finalMarkY, { parts: "se", ...tickOptions});
        } else {
            // fold line
            page.drawLine({
                start: { x: printerMarginDoc, y: pageHeight / 2 },
                end: { x: pageWidth - printerMarginDoc, y: pageHeight /2 },
                thickness: 0.4,
                color: PDFLib.grayscale(0.3),
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
    
    const generatedPdf = async (cards, options) => {
        const cardWidth = options.cardWidth;
        const cardHeight = options.cardHeight;
    
        const cardMargin = withDefault(options.cardMargin, 2);
        const cutMargin = withDefault(options.cutMargin, 0);
        const foldingMargin = withDefault(options.foldingMargin, 5);
        const printerMargin = withDefault(options.printerMargin, 5);
        const cutterOffset = withDefault(options.cutterOffset, 0);
    
        const pageSize = validated(options.pageSize, x => PDFLib.PageSizes[x] !== undefined, "A4");
        const foldLine = validated(options.foldLine, x => ["vertical", "horizontal"].includes(x), "vertical");
        const title = withDefault(options.title, "CardFoldr PDF");
    
        const pageFormat = PDFLib.PageSizes[pageSize];
    
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
    
            const unitWidth = rotate ? cardHeightDoc : cardWidthDoc;
            const unitHeight = rotate ? cardWidthDoc : cardHeightDoc;
            totalHeight = maxCardsPerPage * unitHeight + (maxCardsPerPage - 1) * cardMargin * mmFactor;
            totalWidth = 2 * unitWidth + cardMargin * mmFactor;
        } else {
            if (cardWidth < usableHalf && cardHeight < usableHalf) {
                // card fits on half of the page in both orientations, lets figure out how many cards we can fit
                const cardsPerPageWidth = Math.floor(usableWidth / (cardWidthDoc + cardMarginDoc));
                const cardsPerPageHeight = Math.floor(usableWidth / (cardHeightDoc + cardMarginDoc));
    
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
    
            const unitWidth = rotate ? cardHeightDoc : cardWidthDoc;
            const unitHeight = rotate ? cardWidthDoc : cardHeightDoc;
            totalWidth = maxCardsPerPage * unitWidth + (maxCardsPerPage - 1) * cardMargin * mmFactor;
            totalHeight = 2 * unitHeight + cardMargin * mmFactor;
        }
    
        reportProgress(0, cards.length);
    
        const url = "https://foosel.github.io/cardfoldr";
        const now = new Date();
        const pdfDoc = await PDFLib.PDFDocument.create();
        pdfDoc.setTitle(title);
        pdfDoc.setAuthor(url);
        pdfDoc.setProducer(url);
        pdfDoc.setCreator(`CardFoldr (${url})`);
        pdfDoc.setCreationDate(now);
        pdfDoc.setModificationDate(now);
    
        const deduplicationLUT = {};
        const lookupCard = async (card) => {
            if (!deduplicationLUT[card]) {
                if (card.startsWith("data:image/png;base64,")) {
                    deduplicationLUT[card] = await pdfDoc.embedPng(card);
                } else {
                    deduplicationLUT[card] = await pdfDoc.embedJpg(card);
                }
            }
            return deduplicationLUT[card];
        }

        let count = 0;
        let pages = 0;
        let page = null;

        for (const card of cards) {
            const frontImage = await lookupCard(card.front);
            const backImage = await lookupCard(card.back);
    
            if (page == null || count % maxCardsPerPage === 0) {
                drawMarkup(page, foldLine, rotate, pageWidth, pageHeight, cardWidth, cardHeight, totalWidth, totalHeight, cardMargin, foldingMargin, cutMargin, printerMargin, cutterOffset, maxCardsPerPage);
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

            reportProgress(count, cards.length);
        }
        drawMarkup(page, foldLine, rotate, pageWidth, pageHeight, cardWidth, cardHeight, totalWidth, totalHeight, cardMargin, foldingMargin, cutMargin, printerMargin, cutterOffset, maxCardsPerPage);

        reportSaving();
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        reportDone(cards.length, pages, pdfBytes.byteLength);

        postMessage({ pdf: {
            pdfBytes: pdfBytes,
            aspectRatio: pageWidth / pageHeight,
        }}, [pdfBytes.buffer]);
    };
    
    const reportProgress = (done, all) => {
        reportState("progress", {
            done, all, progress: Math.round(done * 100 / all)
        });
    }

    const reportSaving = () => {
        reportState("saving");
    }

    const reportDone = (cards, pages, bytes) => {
        reportState("done", { cards, pages, bytes });
    }

    const reportState = (state, data) => {
        postMessage({ state, data });
    }
    
    const onmessage = async (e) => {
        if (e.data.generatePdf) {
            const { cards, options } = e.data.generatePdf;
            await generatedPdf(cards, options);
        }
    }
    
    addEventListener("message", onmessage);

    console.log("Worker loaded");
} else {
    console.log("Loading worker...");
}

