/* React terminal tab component
 * Aims to be equivalent to the KO version built into OctoPrint,
 * as a proof of concept for using React to create a UI.
 * Copyright (c) Charlie Powell 2021 - Licensed under the terms of the MIT license.
 */

import { nanoid } from 'nanoid/non-secure';

const React = window.React;
const ReactDOM = window.ReactDOM;
const OctoPrint = window.OctoPrint;

function LinkBtn (props){
    return (
        <a className={"btn " + props.className} onClick={props.onClick}>
            {props.text}
        </a>
    )
}

function Button (props){
    return (
        <button className={"btn " + props.className} onClick={props.onClick}>
            {props.text}
        </button>
    )
}

function Span (props){
    return (
        <span className={props.className}>{props.text}</span>
    )
}

class LogLine extends React.Component {
    constructor(props){
        super(props);
        this.type = props.type;
        this.line = props.value.line
    }
    render() {
        return (
            <span className={(this.type === 'warn') ? 'text-error' : null}>
                {this.line + '\n'}
            </span>
        )
    }
}

class TerminalLog extends React.Component {
    constructor(props) {
        super(props);
        this.terminalElement = React.createRef();
    }

    componentDidUpdate(){
        if (this.props.autoscroll){
            this.terminalElement.current.scrollTop = this.terminalElement.current.scrollHeight;
        }
    }

    render() {
        const logLines = this.props.logLines;
        const logItems = logLines.map((line) =>
            <LogLine key={line.id} value={line} />
        )
        return (
            <pre
                className={"pre-output pre-scrollable"}
                ref={this.terminalElement}
                onScroll={this.props.scrollHandler}
            >
                {logItems}
                <div />
            </pre>
        )
    }
}

class TerminalInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            command: '',
            history: [],
            historyIndex: 0
        }
        this.handleChange = this.handleChange.bind(this)
        this.sendCommand = this.sendCommand.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)

        this.commandRe = /^(([gmt][0-9]+)(\.[0-9+])?)(\s.*)?/i;
    }

    handleChange(event) {
        this.setState({command: event.target.value})
    }

    handleKeyUp(event) {
        if (event.keyCode === 13) {
            this.sendCommand();
        }
    }

    handleKeyDown (event) {
        let keyCode = event.keyCode;
        // This is where we will handle history (up/down arrows)
        if (keyCode === 38 || keyCode === 40) {
            if (
                keyCode === 38 &&
                this.state.history.length > 0 &&
                this.state.historyIndex > 0
            ) {
                this.setState((state) => ({
                    historyIndex: state.historyIndex - 1,
                    command: state.history[state.historyIndex - 1],
                }));
            } else if (
                keyCode === 40 &&
                this.state.historyIndex < this.state.history.length - 1
            ) {
                this.setState((state) => ({
                    historyIndex: state.historyIndex + 1,
                    command: state.history[state.historyIndex + 1],
                }));
            }

            if (
                this.state.historyIndex >= 0 &&
                this.state.historyIndex < this.state.history.length
            ) {
                this.setState((state) => ({
                    command: state.history[state.historyIndex]
                }));
            }

            // prevent the cursor from being moved to the beginning of the input field (this is actually the reason
            // why we do the arrow key handling in the keydown event handler, keyup would be too late already to
            // prevent this from happening, causing a jumpy cursor)
            event.preventDefault();
        }
    }

    sendCommand () {
        let command = this.state.command;
        if (!command){return;}

        let commandToSend = command;
        let commandMatch = commandToSend.match(this.commandRe);
        if (commandMatch !== null) {
            let fullCode = commandMatch[1].toUpperCase(); // full code incl. sub code
            let mainCode = commandMatch[2].toUpperCase(); // main code only without sub code

            commandToSend = commandToSend.toUpperCase();

            // TODO blacklist functionality - requires settings
            // copied here from OctoPrint's terminal view model, but we have no settings so it can't be implemented
            /*if (
                self.blacklist.indexOf(mainCode) < 0 &&
                self.blacklist.indexOf(fullCode) < 0
            ) {
                // full or main code not on blacklist -> upper case the whole command
                commandToSend = commandToSend.toUpperCase();
            } else {
                // full or main code on blacklist -> only upper case that and leave parameters as is
                commandToSend =
                    fullCode + (commandMatch[4] !== undefined ? commandMatch[4] : "");
            }*/
        }

        if (commandToSend) {
            var self = this;
            OctoPrint.control.sendGcode(commandToSend).done(function () {
                self.setState((state) => ({
                    history: state.history.concat([command]).slice(-300),  // Set a sane limit on number of commands to be saved
                    historyIndex: (state.history.length < 300) ? state.history.length + 1 : 300,
                    command: ''
                }))
            });
        }
    }

    render() {
        return (
            <div className={"input-block-level input-append"}>
                <input
                    type="text"
                    value={this.state.command}
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={this.handleKeyUp}
                    autoComplete="off"/>
                <LinkBtn className={"add-on"} onClick={this.sendCommand} text={"Send"} />
            </div>
        )
    }
}


class TerminalTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            autoscroll: true,
            logLines: [],
            scrollPos: undefined,
        }
        this.toggleAutoScroll = this.toggleAutoScroll.bind(this);
        this.handleScrollEvent = this.handleScrollEvent.bind(this);
    }

    handleScrollEvent (event){
        let pos = event.nativeEvent.target.scrollTop;
        let top = event.nativeEvent.target.scrollHeight;
        console.log("pos " + pos)
        console.log("top " + top)
        if (top - pos > 360) {  // TODO this is a temporary hack to work out if the scroll has moved from the bottom
            this.setState({autoscroll: false})
        }
    }

    toggleAutoScroll (){
        this.setState((state) => ({autoscroll: !state.autoscroll}));
    }

    componentDidMount (){
        var self = this;
        OctoPrint.socket.onMessage("current", (msg) => {
            let logs = msg.data.logs;

            self.setState((state) => ({
                logLines: state.logLines.concat(
                    _.map(logs,function(line){return toInternalFormat(line)})
                ).slice(state.autoscroll ? -300 : -1500)
            }))
        })
    }

    render() {
        return (
            <div className="terminal">
                <TerminalLog
                    logLines={this.state.logLines}
                    autoscroll={this.state.autoscroll}
                    scrollHandler={this.handleScrollEvent}
                />
                <TerminalInput />
                <small className={"pull-left"}>
                    <Button
                        className={'btn-small ' + (this.state.autoscroll ? 'active' : '')}
                        onClick={this.toggleAutoScroll}
                        text={this.state.autoscroll ? 'Autoscrolling' : 'Autoscroll'}
                    />
                    <Span text={"showing " + this.state.logLines.length + " lines"}/>
                </small>
            </div>
        )
    }
}

// ========================================
// RENDER the UI

ReactDOM.render(
    <TerminalTab />,
    document.getElementById('react-root')
);

// ========================================
// Helper functions
function toInternalFormat (line, display, type) {
    if (display === undefined) {
        display = "line";
    }

    if (type === undefined) {
        if (line.startsWith("Recv:")) {
            type = "recv";
        } else if (line.startsWith("Send:")) {
            type = "send";
        } else if (line.startsWith("Warn:")) {
            type = "warn";
        }
    }

    return {
        line: escapeUnprintableCharacters(line),  // defined in helpers.js coreUI
        id: nanoid(7),
        // Unique ID that gets React to render lists properly
        // https://robinpokorny.medium.com/index-as-a-key-is-an-anti-pattern-e0349aece318
        // number of characters calculated with https://zelark.github.io/nano-id-cc/ -
        // 5 IDs a second, will take 7 years to have 1% chance of collision which is more than enough, considering we only
        // store 300-1500 IDs, probably slower than 5 per second especially when idling. 7 years is a long time.
        display: display,
        type: type
    };
}

