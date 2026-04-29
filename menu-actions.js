export async function handleGenerateButtonClick(generateAndCopy, closeMenu) {
    if (await generateAndCopy())
        closeMenu();
}
