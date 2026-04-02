export function handleGenerateButtonClick(generateAndCopy, closeMenu) {
    if (generateAndCopy())
        closeMenu();
}
