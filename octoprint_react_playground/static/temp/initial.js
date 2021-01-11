const React = window.React;
const ReactDOM = window.ReactDOM;
const OctoPrint = window.OctoPrint;

function Button (props) {
    return (
        <button className="btn btn-primary" onClick={props.onClick}>
            {props.text}
        </button>
    )
}

class StateString extends React.Component {
    render() {
        if (this.props.value){
            return (
                <div>
                    <span title={this.props.title}>{this.props.label}</span>:
                    <strong> {this.props.value}</strong>
                    <br/>
                </div>
            );
        } else return (
            <div/>
        )
    }
}

class StatePanel extends React.Component {
    renderButtons () {
        return (
            <div>
                <Button
                    text = "Click to change state"
                    onClick={() => this.handleClick()}
                    />
                <Button
                    text= "Connect to socket"
                    onClick={() => this.connectSocket()}
                    />
            </div>
        )
    }

    connectSocket () {
        var thisthing = this;
        OctoPrint.socket.onMessage("current", function(message){thisthing.handleSocketMessage(message)})
    }

    handleSocketMessage (message) {
        this.setState({socketMsg: JSON.stringify(message)})
    }

    handleClick () {
        var thisthing = this
        OctoPrint.get("api/printer").done(function (response){
            thisthing.setState({
                stateString: response.state.text,
            })
        })
        OctoPrint.get("api/job").done(function(response){
            thisthing.setState({
                file: response.job.file.display,
                uploaded: response.job.file.date,
                print_time: response.job.file.estimatedPrintTime,
            })
        })
    }



    constructor(props){
        super(props);
        this.state = {
            stateString: null,
            file: "-",
            uploaded: "-",
            timelapse: "-",
            total_time: "-",
            print_time: "-",
            time_left: "-",
            printed: "-",
            socketMsg: 0
        }
    }

    render() {
        return (
            <div>
                <StateString title="Current printer state" label="State" value={this.state.stateString}/>
                <StateString title="Current selected file" label="File" value={this.state.file}/>
                <StateString title="Uploaded date" label="Uploaded" value={this.state.uploaded}/>
                <StateString title="Print time" label="Print Time" value={this.state.print_time}/>
                <StateString title="Socket msg" label="Socket" value={this.state.socketMsg}/>
                {this.renderButtons()}
            </div>
        )
    }
}


// ========================================

ReactDOM.render(
    <StatePanel />,
    document.getElementById('react-root')
);
