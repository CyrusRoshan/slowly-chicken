/** Removes console logs when loaded locally.
 * This does not affect the host page, because content
 * scripts are isolated.
 */
const DEV_MODE = !chrome.runtime.getManifest().update_url;
if (!DEV_MODE) {
  for (const key in console) {
    console[key] = () => { }
  }
}

const timings = {
  CHICKEN_HOW_OFTEN: 2 * 60 * 1000,
  CHICKEN_AFTER_INACTIVE: 5 * 60 * 1000,
}

setInterval(runWhenHidden(() => measurePerformance(chicken)), timings.CHICKEN_HOW_OFTEN)

const wordRegexp = new RegExp(/[a-z@]\S{2}\S*\w/gi) // 4 letter words and up
const chickenRegexp = new RegExp(/chicken/i)

/** Implements our hiding logic */
function runWhenHidden(fn: () => void) {
  let nextOkayInterval: number | undefined;
  return () => {
    if (document.visibilityState === 'visible') {
      nextOkayInterval = undefined;
      return;
    }

    if (!nextOkayInterval) {
      nextOkayInterval = Date.now() + timings.CHICKEN_AFTER_INACTIVE
      console.log('Set delay', timings.CHICKEN_AFTER_INACTIVE)
      return
    } else {
      const diff = nextOkayInterval - Date.now()
      if (diff > 0) {
        console.log('Wait', diff)
        return
      }
    }

    fn()
  }
}

let runs = 0;
function chicken() {
  // A fast approximation: document.body.innerText concats text nodes
  // meaning that it's possible for two text nodes to exist, e.g.
  // A: "That is" and B: "So then",
  // such that document.body.innerText === "That isSo then"
  // So words are counted differently using this, 
  // than by visiting all text nodes
  const totalWordsToChange = getTotalWordsToChange(document.body.innerText)
  console.log(`runs: ${runs++}, total words left to change: ${totalWordsToChange}`)
  if (!totalWordsToChange) {
    console.log('[Oven timer!]')
    return
  }

  const textNodes = textNodesInside(document.body)
  const wordsToChangePerNode = textNodes.map(node => getTotalWordsToChange(node.textContent))

  const wordIndexToChange = randomNumber(totalWordsToChange)
  const offsets = getNodeWordOffset(wordIndexToChange, wordsToChangePerNode)
  if (!offsets) {
    console.error('Offsets did not match up', { totalWordsToChange, wordIndexToChange, wordsToChangePerNode })
    return
  }

  changeNodeWord(textNodes[offsets.nodeIndex], offsets.wordIndex)
}

/** A helper function to log scripting time of a function */
function measurePerformance(fn: () => void) {
  const start = performance.now();
  fn()
  const end = performance.now();
  console.log('Took', end - start, 'ms')
}

/** Changes the nth word inside a node to a "chicken", case-sensitive */
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

/** 
 * Given the total word offset, finds the index of the node that 
 * contains, that word and the offset of that word relative to
 * the start of the node
 */
function getNodeWordOffset(totalWordOffset: number, wordsPerNode: number[]): { nodeIndex: number, wordIndex: number } | undefined {
  let remainingOffset = totalWordOffset
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

/** Gets the total number of non-"chicken" words */
function getTotalWordsToChange(text: string | undefined): number {
  if (!text) {
    return 0;
  }

  const allWords = getAllWordsFrom(text)
  const nonChickenWords = getNonChickenWords(allWords)

  return nonChickenWords.length;
}

/** Gets all word substrings, given a string */
function getAllWordsFrom(str: string): string[] {
  return str.match(wordRegexp) ?? []
}

/** Gets the non-"chicken" words, i.e. words to replace */
function getNonChickenWords(words: string[]): string[] {
  return words.filter(word => !chickenRegexp.test(word))
}

/**
 * Returns all text nodes inside a parent node
 * From https://stackoverflow.com/a/10730777
 */
function textNodesInside(element: HTMLElement): Node[] {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node: Node | undefined;
  while (node = walker.nextNode()) {
    textNodes.push(node)
  }

  return textNodes
}