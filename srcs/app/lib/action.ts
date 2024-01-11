/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#value
 *
 * - 0: No button or un-initialized
 * - 1: Primary button (usually the left button)
 * - 2: Secondary button (usually the right button)
 * - 4: Auxiliary button (usually the mouse wheel button or middle button)
 * - 8: 4th button (typically the "Browser Back" button)
 * - 16 : 5th button (typically the "Browser Forward" button)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mouseMap = {
  0: 'none',
  1: 'primary',
  2: 'secondary',
  4: 'auxiliary',
  8: '4th',
  16: '5th',
};

/**
 * Use `KeyboardEvent` globally, to register keys
 * Use `MouseEvent` ... to ...
 */

/**
 * A way to enable key sequences, for things like goto number etc.
 */

/**
 * Shortcut popups ...
 *  <kbd>Ctrl+S</kbd> > Save
 *  <kbd>Ctrl+Z</kbd> > undo
 *  <kbd>Ctrl+Y</kbd> > redo
 */

/**
 * Connect HTML elements to actions in custom components
 * You should be able to define HTML and click on the attribute and select an action
 * depending on the element you should be able to pass data to the action etc...
 *
 * figure out styling ...
 */

// Define the undo and redo shortcuts
const shortcuts: Record<string, string> = {
  'Ctrl+Z': 'undo',
  'Ctrl+Y': 'redo',
};

/**
 * Item coordinate matching ...
 *
 *
 */

/**
 * Area's were operations can be performed on...
 * to reduce
 */

/**
 * Update state call > adds to stack...
 */

/**
 * Call action > adds to undo > redo stack shows button when clicked a list of all previous actions and you can through the call stack by click one of the items...
 */

/**
 * What is an action? Whhat isn't?
 */

/**
 * This should register keyboard and mouse events
 *
 * Add key sequence option
 */
export function registerShortcuts() {
  window.addEventListener('keydown', (event) => {
    const shortcut = getShortcutFromEvent(event);
    if (shortcut && shortcuts[shortcut]) {
      handleShortcut(shortcuts[shortcut]);
      event.preventDefault();
    }
  });
}

function getShortcutFromEvent(event: KeyboardEvent) {
  let shortcut = '';

  if (
    event.key == 'Control' ||
    event.key == 'Shift' ||
    event.key == 'Alt' ||
    event.key == 'Meta'
  ) {
    return event.key === 'Control' ? 'Ctrl' : event.key;
  }

  if (event.ctrlKey) {
    shortcut += 'Ctrl+';
  }
  if (event.altKey) {
    shortcut += 'Alt+';
  }
  if (event.shiftKey) {
    shortcut += 'Shift+';
  }
  if (event.metaKey) {
    shortcut += 'Meta+';
  }

  if (event.key.length == 1) {
    return shortcut + event.key.toUpperCase();
  }
  if (event.key.length > 1) {
    return shortcut + event.key;
  }

  return shortcut;
}

interface ActionT {
  do: () => void;
  undo: () => void;
}

class Action {
  private doAction: () => void;
  private undoAction: () => void;

  constructor(doAction: () => void, undoAction: () => void) {
    this.doAction = doAction;
    this.undoAction = undoAction;
  }
  do() {
    this.doAction();
  }
  undo() {
    this.undoAction();
  }
}

export type ActionMap = Record<string, Action>;

export const actionMap: ActionMap = {
  save: new Action(
    () => console.log('do'),
    () => console.log('undo'),
  ),
};

// Define the undo and redo stacks
const undoStack: ActionT[] = [];
const redoStack: ActionT[] = [];

// Handle the undo and redo actions
function handleShortcut(action: string) {
  switch (action) {
    case 'undo': {
      {
        const command = undoStack.pop();
        if (command) {
          command.undo();
          redoStack.push(command);
        }
      }
      break;
    }
    case 'redo': {
      {
        const command = redoStack.pop();
        if (command) {
          command.do();
          undoStack.push(command);
        }
      }
      break;
    }
    default: {
      // Unknown action
      break;
    }
  }
}

// Define a sample action for testing
function setText() {
  const command = new Action(
    () => {
      console.log('do');
    },
    () => {
      console.log('undo');
    },
  );
  command.do();
  undoStack.push(command);
}

setText();
