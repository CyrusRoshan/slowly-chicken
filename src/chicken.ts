const timings = {
  CHICKEN_HOW_OFTEN: 2 * 60 * 1000,
  CHICKEN_AFTER_INACTIVE: 5 * 60 * 1000,
}

setInterval(chicken, timings.CHICKEN_HOW_OFTEN)

const DEBUG = false;
if (!DEBUG) {
  for (const key in console) {
    console[key] = () => {}
  }
}

const wordRegexp = new RegExp(/[a-z@](?:\S|\w)+/gi)
const chickenRegexp = new RegExp(/chicken/i)

let runs = 0;
let nextOkayInterval: number | undefined;
function chicken() {
  if (document.visibilityState !== 'hidden') {
    nextOkayInterval = undefined;
    return;
  }

  if (!nextOkayInterval) {
    nextOkayInterval = Date.now() + timings.CHICKEN_AFTER_INACTIVE
  }
  
  const totalWordsToChange = getTotalWordsToChange(document.body.innerText)
  console.log(`runs: ${runs++}, total words left to change: ${totalWordsToChange}`)
  if (!totalWordsToChange) {
    console.log('[Oven timer!]')
    return
  }

  const textNodes = textNodesUnder(document.body)
  const wordsToChangePerNode = textNodes.map(node => getTotalWordsToChange(node.textContent))

  const wordIndexToChange = randomNumber(totalWordsToChange)
  const offsets = getOffsets(wordIndexToChange, wordsToChangePerNode)
  if (!offsets) {
    console.error('Offsets did not match up', { totalWordsToChange, wordIndexToChange, wordsToChangePerNode })
    return
  }

  changeNodeWord(textNodes[offsets.nodeIndex], offsets.wordIndex)
}

function changeNodeWord(node: Node, wordIndex: number) {
  const text = node.textContent

  let index = 0;
  node.textContent = text.replace(wordRegexp, (word) => {
    const isChicken = chickenRegexp.test(word)
    if (isChicken) {
      return word;
    }

    const prevIndex = index;
    index++
    if (wordIndex === prevIndex) {
      const isCaps = word.toUpperCase() === word
      if (isCaps) {
        return "CHICKEN"
      }
      const isUpperCase = word[0].toUpperCase() === word[0]
      if (isUpperCase) {
        return "Chicken"
      }
      return "chicken"
    }

    return word;
  })
}

function getOffsets(totalOffset: number, wordsPerNode: number[]): { nodeIndex: number, wordIndex: number } | undefined {
  let remainingOffset = totalOffset
  let i = 0;
  while (remainingOffset >= 0 && i < wordsPerNode.length) {
    const nodeWords = wordsPerNode[i]

    if (nodeWords > remainingOffset) {
      return {
        nodeIndex: i,
        wordIndex: remainingOffset,
      }
    }
    remainingOffset -= nodeWords
    i++;
  }
  return undefined;
}

function randomNumber(nonInclusiveMax: number): number {
  return Math.floor(Math.random() * nonInclusiveMax);
}

function getTotalWordsToChange(text: string | undefined): number {
  if (!text) {
    return 0;
  }

  const allWords = getWordsFrom(text)
  const nonChickenWords = getNonChickenWords(allWords)

  return nonChickenWords.length;
}

function getWordsFrom(str: string): string[] {
  return str.match(wordRegexp) ?? []
}

function getNonChickenWords(words: string[]): string[] {
  return words.filter(word => !chickenRegexp.test(word))
}

// From https://stackoverflow.com/a/10730777
function textNodesUnder(element: HTMLElement): Node[] {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node: Node | undefined;
  while (node = walker.nextNode()) {
    textNodes.push(node)
  }

  return textNodes
}