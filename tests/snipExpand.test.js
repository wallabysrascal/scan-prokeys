const testURLs = [
        {
            url:
        "https://stackoverflow.com/questions/50990292/"
        + "using-octal-character-gives-warning-multi-character-character-constant",
            textBoxQueryString: "#wmd-input",
        },
        {
            url:
        "https://serverfault.com/questions/971011/"
        + "how-to-check-if-an-active-directory-server-is-reachable-from-an-ubuntu-apache-ph",
            textBoxQueryString: "#wmd-input",
        },
    ],
    testSnippets = [
        {
            snipText: "abrbc",
            expansion: "abe right backc",
            cursorChange: "h",
        },
        {
            snipText: "brb",
            expansion: "be right back",
            cursorChange: "",
        },
    ];
/*
 * Wait for given milliseconds
 */
function sleep(milliseconds) {
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
        if (new Date().getTime() - start > milliseconds) {
            break;
        }
    }
}

/*
 * Expands a snippet on the given page
 */
async function expandSnippet(page) {
    // give some time [sometimes, the text didn't get expanded]
    await sleep(300);

    // emulate default expand snip
    await page.keyboard.down("Shift");
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    await page.keyboard.up("Shift");
}

/* Function to move the cursor a bit
 * hjkl
 * ----
 *  h: move cursor left
 *  j: move cursor down
 *  k: move cursor up
 *  l: move cursor right
 *
 * eg: to move cursor 3 left, change = "hhh"
 */
async function positionCursor(page, change) {
    const changeMap = {
        h: "ArrowLeft",
        j: "ArrowDown",
        k: "ArrowUp",
        l: "ArrowRight",
    };

    for (let i = 0; i < change.length; i++) {
        const delta = change[i];

        if (delta in changeMap) {
            // !! reqd, since can't parallelize button presses
            // eslint-disable-next-line no-await-in-loop
            await page.keyboard.press(changeMap[delta]);
        }
    }
}

/*
 * Function to return the expanded value of a snippet
 */
async function getExpandedSnippet(
    page,
    textBoxQueryString,
    snipText,
    cursorChange,
) {
    // find the textbox and focus it
    const textBox = await page.$(textBoxQueryString);
    await page.focus(textBoxQueryString);

    // type the snip text [and some extra, if reqd]
    await page.keyboard.type(snipText);

    if (cursorChange) {
        await positionCursor(page, cursorChange);
    }

    // expand the snippet
    await expandSnippet(page);

    // wait for some time
    await sleep(300);

    // retrieve the expanded value
    const expandedText = await page.evaluate(txt => txt.value, textBox);

    // reset the input field for next expansion
    await page.evaluate((txtBox) => {
        txtBox.value = "";
    }, textBox);

    return expandedText;
}

/* eslint-disable no-await-in-loop */
describe("SnipppetExpand", () => {
    beforeAll(async () => {
        await page.setViewport({ width: 1920, height: 1080 });
    });

    for (let pageIndex = 0; pageIndex < testURLs.length; pageIndex++) {
        const testPage = testURLs[pageIndex],
            { url } = testPage,
            { textBoxQueryString } = testPage;

        (async () => {
            await page.goto(url);
        })();

        for (let snipIndex = 0; snipIndex < testSnippets.length; snipIndex++) {
            const testSnippet = testSnippets[snipIndex],
                { snipText } = testSnippet,
                { expansion } = testSnippet,
                { cursorChange } = testSnippet;

            it("Should match", async () => {
                await expect(
                    await getExpandedSnippet(
                        page,
                        textBoxQueryString,
                        snipText,
                        cursorChange,
                    ),
                ).toBe(expansion);
            });
        }

        (async () => {
            await page.close();
        })();
    }
});
/* eslint-enable no-await-in-loop */