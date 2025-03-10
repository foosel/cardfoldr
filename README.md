# 🃏 CardFoldr

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/foosel/cardfoldr/deploy.yml)
![GitHub License](https://img.shields.io/github/license/foosel/cardfoldr)
[![BGG Thread](https://img.shields.io/badge/BGG-Thread-purple?logo=boardgamegeek)](https://boardgamegeek.com/thread/3298313/i-created-a-tool-to-create-foldable-card-pdfs-from)
[![BGG Geeklist](https://img.shields.io/badge/BGG-Geeklist-purple?logo=boardgamegeek)](https://boardgamegeek.com/geeklist/336986/cardfoldr-settings-for-games)

CardFoldr is a tool to help you convert a PDF of card grids (say, 3x3 cards per page, several pages of fronts and one page of backs) into a gutterfold PDF: card fronts and backs on the same page, with a foldline down the middle for easy double sided alignment.

It is meant to help with building print'n'play games.

## Changelog

[See CHANGELOG.md](CHANGELOG.md).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

CardFoldr uses the following fine projects:

- [PDF.js](https://mozilla.github.io/pdf.js/) 
- [PDF-Lib](https://pdf-lib.js.org/)
- [pure.css](https://purecss.io/)
- [Font Awesome](https://fontawesome.com/)
- [Playwright](https://playwright.dev/)

## Development

A [Taskfile](https://taskfile.dev/) is provided that features the following commands:

- `serve`: Serves the app on `localhost:8000`
- `test`: Runs the test suite
- `test-ui`: Runs the test suite with Playwright's UI
- `test-report`: Opens the report of the latest test run
- `update-screenshots`: Updates the screenshots used for expected PDF output results
