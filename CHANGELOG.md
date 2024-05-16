# Changelog

## 2024-05-15

### ✨ Improvements

- Scrolling the pages and card area by mousewheel now happens horizontally. This should make navigating these easier.
- Page and card title bars are now at the top and the bottom of the item. This makes it easier to toggle page selection and also makes information more readily available while scrolling through large amounts of pages or cards.
- Improved the performance of PDF generation by moving it to a background worker. This should make the UI more responsive while generating the PDF and also give better feedback while the generation process is ongoing. Implements #11.
- Added some basic deduplication while embedding the card images into the PDF. This helps to reduce the file size. One step towards solving #2.

## 2024-05-14

### ✨ Improvements

- Pages from source and optional back PDF can now be selected/deselected by clicking on their title bars. Implements #5.
- Added an input field for the generated PDF filename, sourced from the input PDF filename by default. Implements #3.
- Step 3 and 4 can now be automatically triggered once their requirements are met. This is enabled by checking the corresponding checkbox next to the buttons. Should help with batching multiple PDFs with the same grid. See also #8.

### 🐛 Bug fixes

- Fixed a broken sanity check for the duplex settings.
- Fixed the total card calculation in the card headers.

## 2024-05-13

### ✨ Improvements

- Added an option to rotate the card backs by 180° if they are upside down compared to the fronts otherwise.
- The orientation of the cards towards the foldline can now be selected, either "bottom" (default) or "top".

### 🐛 Bug fixes

- Fixed page fetched from backs PDF if only using a single back from it, it was not recognizing the configured page selection.

## 2024-05-12

### ✨ Improvements

- You can now deselect extracted cards from inclusion in the final PDF (helpful for source PDFs that have some empty parts on the pages, you can now exclude the unusable "cards" generated from those and save space in your final PDF)
- Added an optional cutter offset option to visualize on the cutter marks, in case your cutter's knife has an offset from the ruler edge (like mine). That will cause a grey offset area to be also generated around the actual cutter mark, so when you put the ruler against THAT the cutter should then cut right on the line.

## 2024-05-10

### ✨ Improvements

- Added a coordinate display when mousing over the rendered source PDF. This displays the coordinate of the mouse cursor translated to document location (in mm) and also the distance to the currently defined grid origin. That allows to quickly figure out what to set both start point and width and height to and thus makes the grid definition way faster than before.
- Card back PDFs with multiple card backs are now supported. If selected, both the front and back pdf need to have the same page count. Cards from the face PDF will be matched to the same ones in the backs PDF. This made some of the provided (single card multi page) PDFs for Maximum Apocalypse work great.
- The name of the input PDF is now used as base for generating the download name of the generated PDF.
- Improved output quality.
- Added horizontal folding and auto detection of optimal card orientation for maximum cards per page.
- Added PDF metadata.
- Better reload behaviour, error handling, workflow enforcement (only enable PDF generation after card extraction etc) and lots of other minor improvements like that.

## 2024-05-09

Initial release! 🎉
