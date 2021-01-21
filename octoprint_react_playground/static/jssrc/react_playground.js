/* React terminal tab component
 * Aims to be equivalent to the KO version built into OctoPrint,
 * as a proof of concept for using React to create a UI.
 * Copyright (c) Charlie Powell 2021 - Licensed under the terms of the MIT license.
 */

import { nanoid } from 'nanoid/non-secure';

import React from 'react';
import ReactDOM from 'react-dom';
const OctoPrint = window.OctoPrint;
const $ = window.$; // I really wanted to avoid jquery, but this is needed for the tab listener since it is not mine.

const ID_PREFIX = "terminal"  // For any components that need IDs, prefix them with this

function prefixId (id){
    return ID_PREFIX + "-" + id
}

function LinkBtn (props){
    return (
        <a className={"btn " + props.className} onClick={props.onClick}>
            {props.text}
        </a>
    )
}

function Button (props){
    // This is probably not the best way of having a default prop, but hey it works
    let disable = false
    if (props.disable === true){
        disable = true
    }
    return (
        <button className={"btn " + props.className} onClick={props.onClick} disabled={disable}>
            {props.text}
        </button>
    )
}

function Span (props){
    return (
        <span className={props.className}>
            {props.text}
        </span>
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
        this.state = {
            visible: true,
        }
        this.terminalElement = React.createRef();
    }

    componentDidMount() {
        // Register a callback for tab change - could be easily done outside jquery if the whole UI was React.
        var self = this;  // TODO is this the best way of callbacks having access to the component?
        const tabs = $("#tabs").find('a[data-toggle="tab"]');
        tabs.on("show", function (e) {
            let current = e.target.hash;
            if (current === '#tab_plugin_react_playground'){
                // For some reason there is a massive lag between this setState call and the component re-rendering
                // TODO Look into this, or don't suspend rendering when tab component is not visible.
                self.setState({visible: true});
            } else {
                self.setState({visible: false});
            }
        });
    }

    componentDidUpdate(){
        // Autoscroll to the bottom of the element
        if (this.props.autoscroll){
            this.terminalElement.current.scrollTop = this.terminalElement.current.scrollHeight;
        }
    }

    shouldComponentUpdate() {
        // Suspend rendering when tab is visible
        return this.state.visible || OctoPrint.coreui.selectedTab === '#tab_plugin_react_playground';
    }

    render() {
        const logItems = this.props.logLines.map((line) =>
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
        // Enter to send
        if (event.keyCode === 13) {
            this.sendCommand();
        }
    }

    handleKeyDown (event) {
        // Cycle through command history using up/down arrows
        let keyCode = event.keyCode;
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
        // Send a command to the printer
        // This method is way more complicated than it needs to be, copied from core OctoPrint
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
                    autoComplete="off"
                    disabled={!this.props.printerState.isOperational}
                />
                <LinkBtn className={"add-on"} onClick={this.sendCommand} text={"Send"} />
            </div>
        )
    }
}

class TerminalStatus extends React.Component {
    constructor(props){
        super(props);
    }


    render(){
        return (
            <React.Fragment>
                <small className={"pull-left"}>
                    <Button
                        className={'btn-mini ' + (this.props.autoscroll ? 'active' : '')}
                        onClick={this.props.onToggleAutoScroll}
                        text={this.props.autoscroll ? 'Autoscrolling' : 'Autoscroll'}
                    />
                    <Span text={" showing " + this.props.logLinesLength + " lines"}/>
                </small>
                <small className={"pull-right"}>
                    <a onClick={this.props.copyAll}>
                        <i className="fas fa-copy" title="Copy all"/>
                        Copy All
                    </a>
                    <br/>
                    <a onClick={this.props.clearAll}>
                        <i className="fas fa-trash-alt" title="Clear all"/>
                        Clear All
                    </a>
                </small>
            </React.Fragment>
        )
    }
}

class AdvancedOptions extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            open: false
        }
        this.toggleVisibility = this.toggleVisibility.bind(this)
    }

    toggleVisibility (){
        this.setState((state) =>{
            $('#terminal-advanced').collapse(state.open ? 'hide' : 'show')
            return {open : !state.open}
        })
    }

    render() {
        return (
            <div className={"row-fluid"}>
                <div>
                    <small>
                        <a className={"muted"} onClick={this.toggleVisibility}>
                            <i className={"fas fa-fw " + (this.state.open ? "fa-caret-down" : "fa-caret-right")}/> Advanced options
                        </a>
                    </small>
                </div>
                <div id={prefixId("advanced")} className={"collapse"} style={{display: "block"}}>
                    <p className="row-fluid">
                        <Button
                            className="btn-primary btn-block"
                            onClick={OctoPrint.connection.fakeAck}
                            disable={!this.props.printerState.isOperational}
                            text={"Fake Acknowledgement"}
                        />
                        <small className="muted">
                            If acknowledgements ("ok"s) sent by the firmware get lost due to issues
                            with the serial communication to your printer, OctoPrint's communication with it can become
                            stuck. If that happens, this can help. Please be advised that such occurrences hint at
                            general communication issues with your printer which will probably negatively influence your
                            printing results and which you should therefore try to resolve!
                        </small>
                    </p>
                </div>
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
            printerState:{
                isErrorOrClosed: undefined,
                isOperational: undefined,
                isPrinting: undefined,
                isPaused: undefined,
                isError: undefined,
                isReady: undefined,
                isLoading: undefined,
            }
        }
        this.toggleAutoScroll = this.toggleAutoScroll.bind(this);
        this.handleScrollEvent = this.handleScrollEvent.bind(this);
        this.processLogs = this.processLogs.bind(this);
        this.processStateData = this.processStateData.bind(this);
        this.clearAll = this.clearAll.bind(this);
        this.copyAll = this.copyAll.bind(this);
    }

    handleScrollEvent (event){
        // Work out if user has scrolled up, and if yes stop autoscroll
        let pos = event.nativeEvent.target.scrollTop;
        let top = event.nativeEvent.target.scrollHeight;
        if (top - pos > 360) {  // TODO this is a temporary hack to work out if the scroll has moved from the bottom
            this.setState({autoscroll: false})
        }
    }

    toggleAutoScroll (){
        this.setState((state) => ({autoscroll: !state.autoscroll}));
    }

    copyAll (){
        let lines = _.map(this.state.logLines, "line")
        copyToClipboard(lines.join("\n"));
    }

    clearAll (){
        this.setState({logLines: []})
    }

    componentDidMount (){
        // Register socket handlers here, after component is ready
        var self = this;
        OctoPrint.socket.onMessage("current", (msg) => {
            self.processLogs(msg)
            self.processStateData(msg)
        })
        OctoPrint.socket.onMessage("history", (msg) => {
            self.processLogs(msg)
            self.processStateData(msg)
        })
    }

    processLogs (msg){
        let logs = msg.data.logs;

        this.setState((state) =>({
            logLines: state.logLines.concat(
                _.map(logs, function(line){return toInternalFormat(line)})
            ).slice(state.autoscroll ? -300 : -1500)
        }))
    }

    processStateData (msg){
        let flags = msg.data.state.flags;
        console.log(flags);
        this.setState({
            printerState:{
                isErrorOrClosed: flags.closedOrError,
                isOperational: flags.operational,
                isPrinting: flags.paused,
                isPaused: flags.printing,
                isError: flags.error,
                isReady: flags.ready,
                isLoading: flags.loading,
            }
        })
    }

    render() {
        return (
            <React.Fragment>
                <div className="terminal">
                    <TerminalLog
                        logLines={this.state.logLines}
                        autoscroll={this.state.autoscroll}
                        scrollHandler={this.handleScrollEvent}
                    />
                    <TerminalInput
                        printerState={this.state.printerState}
                    />
                    <TerminalStatus
                        autoscroll={this.state.autoscroll}
                        onToggleAutoScroll={this.toggleAutoScroll}
                        logLinesLength={this.state.logLines.length}
                        copyAll={this.copyAll}
                        clearAll={this.clearAll}
                    />
                </div>
                <AdvancedOptions printerState={this.state.printerState} />
            </React.Fragment>
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

