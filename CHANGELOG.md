# Changelog

## 2025-03-10

### ✨ Improvements

- Added a link to the BGG geeklist with settings and the discussion thread of the tool on the BGG forums.

## 2024-08-30

###  🐛 Bug fixes

- Fixed an issue where depending on the source PDF, sometimes the cards would not have all the art they should have and instead showed black boxes or other artifacts. This was likely due to the used PDF render library not rendering all the content when only a part of the page was requested to render. Now, the whole page is rendered out once and then only parts of the rendered image are used for the cards. This seems to have fixed the issue.

## 2024-06-07

### ✨ Improvements

- Added an option to add an inner and outer border to the card fronts and backs generated into the PDF. This allows to add additional bleed and margin to the cards, which can be helpful for cutting them out. Additionally, a radius can be added to the card images as well, which helps in removing crop marks included in the source file. Implements #15.
- Added an option to set a target size for the cards in the PDF. This will scale the extracted cards to the target size, auto centering as necessary. It's possible to decide whether to scale the cards to fit or fill the target size, or to just stretch the cards to the target size. A number of common target sizes has been included as selectable presets: Poker, Bridge, Mini, Tarot and Mint. Implements #12.

### 🐛 Bug fixes

- Fixed some logic errors in corner cases of the PDF generation.

## 2024-05-26

### ✨ Improvements

- Added a share button to the presets area that will copy the current settings as shareable URL to the clipboard.
- Turned selected cards into a setting, like the page selection. That way they can also be shared.
- The PDF generation will now - unless configured otherwise - try to make the best of the available space and generate multiple rows of cards. It will also detect whether a horizontal or vertical fold line is best to get as many as possible cards on one page. This should make the generated PDFs more efficient in terms of paper usage, especially in case of tiny cards - or tiles.

### 🐛 Bug fixes

- Fixed an error in the pdf generation logic in case of a horizontal foldline.

## 2024-05-24

### ✨ Improvements

- Added build information and an issue tracker link to the footer.
- Refactored the source tree in preparation for test coverage and CI/CD setup.
- Added a test suite and set up a CI/CD pipeline with GitHub Actions.

### 🐛 Bug fixes

- Fixed card extraction for "separate file (all pages)" mode. It was only extracting the first card of each page instead of going through all of them.
- Fixed card extraction for "duplex (bottom edge)" mode. It was extracting from the wrong location.
- Fixed a race condition causing pages to be duplicated in the grid visualization.

## 2024-05-22

### ✨ Improvements

- Pre-fill settings from query parameters, and sync setting changes to query parameters. This allows for sharing the current state of the app with others by just sharing the URL.
- Added some margin to the page on mobile.
- Preset support! You can now save the current grid and card extraction settings as a preset and load them back later. This should make it easier to work with multiple different PDFs that have the same grid settings. Implements #4.

### 🐛 Bug fixes

- Got rid of the quirks mode warning in the browser console.

## 2024-05-21

### ✨ Improvements

- Automatically update the card grid visualization on input changes, for easier turn around.
- Made the grid settings more compact to make it easier to see the grid and the cards at the same time.

### 🐛 Bug fixes

- Fixed coordinate display for offset from start point.

## 2024-05-20

### 🐛 Bug fixes

- Fixed cut mark generation for no card but cut margin.

## 2024-05-19

### ✨ Improvements

- Improved performance of grid updates.

## 2024-05-18

### ✨ Improvements

- Added support for choosing a step size to use for the grid inputs between 1, 0.5, 0.1, 0.01mm and 0.001mm. Should help with source PDFs that used imperial units for defining the grid. Implements #1
- Extended grid lines to page edges to improve their visibility.

### 🐛 Bug fixes

- Fixed support of 0 margins for PDF layout generation. Closes #14.
- Fixed card auto orientation algorithm.

## 2024-05-16

### ✨ Improvements

- Added a quality setting to the card extraction dialog. Can be used to optimize for file size or image quality. Optimizing for file size will greatly reduce the size of the generated PDF (and the speed of extraction and generation) at the cost of some slight quality reduction on the card images (JPEG vs lossless PNG). However it should usually not matter and thus is now the default. Implements #2.

### 🐛 Bug fixes

- The output PDF will now be removed again before generating a new one.

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
