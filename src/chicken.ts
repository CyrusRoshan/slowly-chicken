import { randomNumber, sum } from './utils';

const wordRegexp = new RegExp(/[a-z@]\S{2}\S*\w/gi); // 4 letter words and up
const chickenRegexp = new RegExp(/chicken/i);

var runs = 0;
export function chickenOneWord() {
  const textNodes = textNodesInside(document.body);
  const wordsToChangePerNode = textNodes.map((node) =>
    getTotalWordsToChange(node.textContent),
  );
  const totalWordsToChange = sum(wordsToChangePerNode);
  console.log(
    `runs: ${runs++}, total words left to change: ${totalWordsToChange}`,
  );
  if (totalWordsToChange === 0) {
    return;
  }

  const wordIndexToChange = randomNumber(totalWordsToChange);
  const offsets = getNodeWordOffset(wordIndexToChange, wordsToChangePerNode);
  if (!offsets) {
    console.error('Offsets did not match up', {
      totalWordsToChange,
      wordIndexToChange,
      wordsToChangePerNode,
    });
    return;
  }

  changeNodeWord(textNodes[offsets.nodeIndex], offsets.wordIndex);
}

/** Changes the nth word inside a node to a "chicken", case-sensitive */
function changeNodeWord(node: Node, wordIndex: number) {
  const text = node.textContent;

  let index = 0;
  node.textContent = text.replace(wordRegexp, (word) => {
    const isChicken = chickenRegexp.test(word);
    if (isChicken) {
      return word;
    }

    const prevIndex = index;
    index++;
    if (wordIndex === prevIndex) {
      const isCaps = word.toUpperCase() === word;
      if (isCaps) {
        return 'CHICKEN';
      }
      const isUpperCase = word[0].toUpperCase() === word[0];
      if (isUpperCase) {
        return 'Chicken';
      }
      return 'chicken';
    }

    return word;
  });
}

/**
 * Given the total word offset, finds the index of the node that
 * contains, that word and the offset of that word relative to
 * the start of the node
 */
function getNodeWordOffset(
  totalWordOffset: number,
  wordsPerNode: number[],
): { nodeIndex: number; wordIndex: number } | undefined {
  let remainingOffset = totalWordOffset;
  let i = 0;
  while (remainingOffset >= 0 && i < wordsPerNode.length) {
    const nodeWords = wordsPerNode[i];

    if (nodeWords > remainingOffset) {
      return {
        nodeIndex: i,
        wordIndex: remainingOffset,
      };
    }
    remainingOffset -= nodeWords;
    i++;
  }
  return undefined;
}

/** Gets the total number of non-"chicken" words */
function getTotalWordsToChange(text: string | undefined): number {
  if (!text) {
    return 0;
  }

  const allWords = getAllWordsFrom(text);
  const nonChickenWords = getNonChickenWords(allWords);

  return nonChickenWords.length;
}

/** Gets all word substrings, given a string */
function getAllWordsFrom(str: string): string[] {
  return str.match(wordRegexp) ?? [];
}

/** Gets the non-"chicken" words, i.e. words to replace */
function getNonChickenWords(words: string[]): string[] {
  return words.filter((word) => !chickenRegexp.test(word));
}

/**
 * Returns all text nodes inside a parent node
 * From https://stackoverflow.com/a/10730777
 */
function textNodesInside(element: HTMLElement): Node[] {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node: Node | undefined;
  while ((node = walker.nextNode())) {
    if (['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
      continue;
    }

    textNodes.push(node);
  }

  return textNodes;
}
