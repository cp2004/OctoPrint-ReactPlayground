/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./octoprint_react_playground/static/jssrc/react_playground.js":
/*!*********************************************************************!*\
  !*** ./octoprint_react_playground/static/jssrc/react_playground.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var nanoid_non_secure__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoid/non-secure */ \"./node_modules/nanoid/non-secure/index.js\");\n/* React terminal tab component\n * Aims to be equivalent to the KO version built into OctoPrint,\n * as a proof of concept for using React to create a UI.\n * Copyright (c) Charlie Powell 2021 - Licensed under the terms of the MIT license.\n */\n\nconst React = window.React;\nconst ReactDOM = window.ReactDOM;\nconst OctoPrint = window.OctoPrint;\nconst $ = window.$; // I really wanted to avoid jquery, but this is needed for the tab listener since it is not mine.\n\nfunction LinkBtn(props) {\n  return /*#__PURE__*/React.createElement(\"a\", {\n    className: \"btn \" + props.className,\n    onClick: props.onClick\n  }, props.text);\n}\n\nfunction Button(props) {\n  return /*#__PURE__*/React.createElement(\"button\", {\n    className: \"btn \" + props.className,\n    onClick: props.onClick\n  }, props.text);\n}\n\nfunction Span(props) {\n  return /*#__PURE__*/React.createElement(\"span\", {\n    className: props.className\n  }, props.text);\n}\n\nclass LogLine extends React.Component {\n  constructor(props) {\n    super(props);\n    this.type = props.type;\n    this.line = props.value.line;\n  }\n\n  render() {\n    return /*#__PURE__*/React.createElement(\"span\", {\n      className: this.type === 'warn' ? 'text-error' : null\n    }, this.line + '\\n');\n  }\n\n}\n\nclass TerminalLog extends React.Component {\n  constructor(props) {\n    super(props);\n    this.state = {\n      visible: true\n    };\n    this.terminalElement = React.createRef();\n  }\n\n  componentDidMount() {\n    // Register a callback for tab change - could be easily done outside jquery if the whole UI was React.\n    var self = this; // TODO is this the best way of callbacks having access to the component?\n\n    const tabs = $(\"#tabs\").find('a[data-toggle=\"tab\"]');\n    tabs.on(\"show\", function (e) {\n      let current = e.target.hash;\n\n      if (current === '#tab_plugin_react_playground') {\n        // For some reason there is a massive lag between this setState call and the component re-rendering\n        // TODO Look into this, or don't suspend rendering when tab component is not visible.\n        self.setState({\n          visible: true\n        });\n      } else {\n        self.setState({\n          visible: false\n        });\n      }\n    });\n  }\n\n  componentDidUpdate() {\n    // Autoscroll to the bottom of the element\n    if (this.props.autoscroll) {\n      this.terminalElement.current.scrollTop = this.terminalElement.current.scrollHeight;\n    }\n  }\n\n  shouldComponentUpdate() {\n    // Suspend rendering when tab is visible\n    return this.state.visible || OctoPrint.coreui.selectedTab === '#tab_plugin_react_playground';\n  }\n\n  render() {\n    const logItems = this.props.logLines.map(line => /*#__PURE__*/React.createElement(LogLine, {\n      key: line.id,\n      value: line\n    }));\n    return /*#__PURE__*/React.createElement(\"pre\", {\n      className: \"pre-output pre-scrollable\",\n      ref: this.terminalElement,\n      onScroll: this.props.scrollHandler\n    }, logItems, /*#__PURE__*/React.createElement(\"div\", null));\n  }\n\n}\n\nclass TerminalInput extends React.Component {\n  constructor(props) {\n    super(props);\n    this.state = {\n      command: '',\n      history: [],\n      historyIndex: 0\n    };\n    this.handleChange = this.handleChange.bind(this);\n    this.sendCommand = this.sendCommand.bind(this);\n    this.handleKeyUp = this.handleKeyUp.bind(this);\n    this.handleKeyDown = this.handleKeyDown.bind(this);\n    this.commandRe = /^(([gmt][0-9]+)(\\.[0-9+])?)(\\s.*)?/i;\n  }\n\n  handleChange(event) {\n    this.setState({\n      command: event.target.value\n    });\n  }\n\n  handleKeyUp(event) {\n    // Enter to send\n    if (event.keyCode === 13) {\n      this.sendCommand();\n    }\n  }\n\n  handleKeyDown(event) {\n    // Cycle through command history using up/down arrows\n    let keyCode = event.keyCode;\n\n    if (keyCode === 38 || keyCode === 40) {\n      if (keyCode === 38 && this.state.history.length > 0 && this.state.historyIndex > 0) {\n        this.setState(state => ({\n          historyIndex: state.historyIndex - 1,\n          command: state.history[state.historyIndex - 1]\n        }));\n      } else if (keyCode === 40 && this.state.historyIndex < this.state.history.length - 1) {\n        this.setState(state => ({\n          historyIndex: state.historyIndex + 1,\n          command: state.history[state.historyIndex + 1]\n        }));\n      }\n\n      if (this.state.historyIndex >= 0 && this.state.historyIndex < this.state.history.length) {\n        this.setState(state => ({\n          command: state.history[state.historyIndex]\n        }));\n      } // prevent the cursor from being moved to the beginning of the input field (this is actually the reason\n      // why we do the arrow key handling in the keydown event handler, keyup would be too late already to\n      // prevent this from happening, causing a jumpy cursor)\n\n\n      event.preventDefault();\n    }\n  }\n\n  sendCommand() {\n    // Send a command to the printer\n    // This method is way more complicated than it needs to be, copied from core OctoPrint\n    let command = this.state.command;\n\n    if (!command) {\n      return;\n    }\n\n    let commandToSend = command;\n    let commandMatch = commandToSend.match(this.commandRe);\n\n    if (commandMatch !== null) {\n      let fullCode = commandMatch[1].toUpperCase(); // full code incl. sub code\n\n      let mainCode = commandMatch[2].toUpperCase(); // main code only without sub code\n\n      commandToSend = commandToSend.toUpperCase(); // TODO blacklist functionality - requires settings\n      // copied here from OctoPrint's terminal view model, but we have no settings so it can't be implemented\n\n      /*if (\n          self.blacklist.indexOf(mainCode) < 0 &&\n          self.blacklist.indexOf(fullCode) < 0\n      ) {\n          // full or main code not on blacklist -> upper case the whole command\n          commandToSend = commandToSend.toUpperCase();\n      } else {\n          // full or main code on blacklist -> only upper case that and leave parameters as is\n          commandToSend =\n              fullCode + (commandMatch[4] !== undefined ? commandMatch[4] : \"\");\n      }*/\n    }\n\n    if (commandToSend) {\n      var self = this;\n      OctoPrint.control.sendGcode(commandToSend).done(function () {\n        self.setState(state => ({\n          history: state.history.concat([command]).slice(-300),\n          // Set a sane limit on number of commands to be saved\n          historyIndex: state.history.length < 300 ? state.history.length + 1 : 300,\n          command: ''\n        }));\n      });\n    }\n  }\n\n  render() {\n    return /*#__PURE__*/React.createElement(\"div\", {\n      className: \"input-block-level input-append\"\n    }, /*#__PURE__*/React.createElement(\"input\", {\n      type: \"text\",\n      value: this.state.command,\n      onChange: this.handleChange,\n      onKeyDown: this.handleKeyDown,\n      onKeyUp: this.handleKeyUp,\n      autoComplete: \"off\"\n    }), /*#__PURE__*/React.createElement(LinkBtn, {\n      className: \"add-on\",\n      onClick: this.sendCommand,\n      text: \"Send\"\n    }));\n  }\n\n}\n\nclass TerminalTab extends React.Component {\n  constructor(props) {\n    super(props);\n    this.state = {\n      autoscroll: true,\n      logLines: [],\n      scrollPos: undefined\n    };\n    this.toggleAutoScroll = this.toggleAutoScroll.bind(this);\n    this.handleScrollEvent = this.handleScrollEvent.bind(this);\n  }\n\n  handleScrollEvent(event) {\n    // Work out if user has scrolled up, and if yes stop autoscroll\n    let pos = event.nativeEvent.target.scrollTop;\n    let top = event.nativeEvent.target.scrollHeight;\n\n    if (top - pos > 360) {\n      // TODO this is a temporary hack to work out if the scroll has moved from the bottom\n      this.setState({\n        autoscroll: false\n      });\n    }\n  }\n\n  toggleAutoScroll() {\n    this.setState(state => ({\n      autoscroll: !state.autoscroll\n    }));\n  }\n\n  componentDidMount() {\n    // Register socket handlers here, should probably be outside in individual functions\n    var self = this;\n    OctoPrint.socket.onMessage(\"current\", msg => {\n      let logs = msg.data.logs;\n      self.setState(state => ({\n        logLines: state.logLines.concat(_.map(logs, function (line) {\n          return toInternalFormat(line);\n        })).slice(state.autoscroll ? -300 : -1500)\n      }));\n    });\n  }\n\n  render() {\n    return /*#__PURE__*/React.createElement(\"div\", {\n      className: \"terminal\"\n    }, /*#__PURE__*/React.createElement(TerminalLog, {\n      logLines: this.state.logLines,\n      autoscroll: this.state.autoscroll,\n      scrollHandler: this.handleScrollEvent\n    }), /*#__PURE__*/React.createElement(TerminalInput, null), /*#__PURE__*/React.createElement(\"small\", {\n      className: \"pull-left\"\n    }, /*#__PURE__*/React.createElement(Button, {\n      className: 'btn-small ' + (this.state.autoscroll ? 'active' : ''),\n      onClick: this.toggleAutoScroll,\n      text: this.state.autoscroll ? 'Autoscrolling' : 'Autoscroll'\n    }), /*#__PURE__*/React.createElement(Span, {\n      text: \"showing \" + this.state.logLines.length + \" lines\"\n    })));\n  }\n\n} // ========================================\n// RENDER the UI\n\n\nReactDOM.render( /*#__PURE__*/React.createElement(TerminalTab, null), document.getElementById('react-root')); // ========================================\n// Helper functions\n\nfunction toInternalFormat(line, display, type) {\n  if (display === undefined) {\n    display = \"line\";\n  }\n\n  if (type === undefined) {\n    if (line.startsWith(\"Recv:\")) {\n      type = \"recv\";\n    } else if (line.startsWith(\"Send:\")) {\n      type = \"send\";\n    } else if (line.startsWith(\"Warn:\")) {\n      type = \"warn\";\n    }\n  }\n\n  return {\n    line: escapeUnprintableCharacters(line),\n    // defined in helpers.js coreUI\n    id: (0,nanoid_non_secure__WEBPACK_IMPORTED_MODULE_0__.nanoid)(7),\n    // Unique ID that gets React to render lists properly\n    // https://robinpokorny.medium.com/index-as-a-key-is-an-anti-pattern-e0349aece318\n    // number of characters calculated with https://zelark.github.io/nano-id-cc/ -\n    // 5 IDs a second, will take 7 years to have 1% chance of collision which is more than enough, considering we only\n    // store 300-1500 IDs, probably slower than 5 per second especially when idling. 7 years is a long time.\n    display: display,\n    type: type\n  };\n}\n\n//# sourceURL=webpack://octoprint-react-playground/./octoprint_react_playground/static/jssrc/react_playground.js?");

/***/ }),

/***/ "./node_modules/nanoid/non-secure/index.js":
/*!*************************************************!*\
  !*** ./node_modules/nanoid/non-secure/index.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"nanoid\": () => /* binding */ nanoid,\n/* harmony export */   \"customAlphabet\": () => /* binding */ customAlphabet\n/* harmony export */ });\n// This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped\n// optimize the gzip compression for this alphabet.\nlet urlAlphabet =\n  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW'\n\nlet customAlphabet = (alphabet, size) => {\n  return () => {\n    let id = ''\n    // A compact alternative for `for (var i = 0; i < step; i++)`.\n    let i = size\n    while (i--) {\n      // `| 0` is more compact and faster than `Math.floor()`.\n      id += alphabet[(Math.random() * alphabet.length) | 0]\n    }\n    return id\n  }\n}\n\nlet nanoid = (size = 21) => {\n  let id = ''\n  // A compact alternative for `for (var i = 0; i < step; i++)`.\n  let i = size\n  while (i--) {\n    // `| 0` is more compact and faster than `Math.floor()`.\n    id += urlAlphabet[(Math.random() * 64) | 0]\n  }\n  return id\n}\n\n\n\n\n//# sourceURL=webpack://octoprint-react-playground/./node_modules/nanoid/non-secure/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./octoprint_react_playground/static/jssrc/react_playground.js");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;