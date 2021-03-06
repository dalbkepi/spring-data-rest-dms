import _ from 'lodash';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import Spinner from './spinner';
import Back from './back';
import CreateDialog from './create_dialog';
import UpdateDialog from './update_dialog';
import DeleteDialog from './delete_dialog';
import Alert from './alert';
import { fetchEndpoint, fetchEndpoints, fetchEndpointMeta, createEntry, updateEntry, deleteEntry } from '../actions';

class EndpointShow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageSize: 10,
            sortDirection: 'asc',
            sortName: '',
            firstAvailable: 'disabled',
            prevAvailable: 'disabled',
            nextAvailable: 'disabled',
            lastAvailable: 'disabled',
            totalElements: 0,
            totalPages: 0,
            currentPage: 1,
            alertVisible: false,
            headline: '',
            response: {}
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleFirst = this.handleFirst.bind(this);
        this.handleLast = this.handleLast.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.handleCreateEntry = this.handleCreateEntry.bind(this);
        this.handleCreateSuccess = this.handleCreateSuccess.bind(this);
        this.handleUpdateEntry = this.handleUpdateEntry.bind(this);
        this.handleUpdateSuccess = this.handleUpdateSuccess.bind(this);
        this.handleDeleteEntry = this.handleDeleteEntry.bind(this);
        this.handleDeleteSuccess = this.handleDeleteSuccess.bind(this);

    }

    componentDidMount() {
        const { url } = this.props.location.state;
        if (!_.isEmpty(url)) {
            this.props.fetchEndpointMeta(url);
            this.loadEndpoint(url.replace(/profile\//, ''), this.state.pageSize);
        }
    }

    componentWillReceiveProps(nextProps){
        if (!_.isEmpty(nextProps.endpoint)){
            this.setState({
                firstAvailable: (_.isEmpty(nextProps.endpoint.first))? 'disabled':'',
                prevAvailable: (_.isEmpty(nextProps.endpoint.prev))? 'disabled':'',
                nextAvailable: (_.isEmpty(nextProps.endpoint.next))? 'disabled':'',
                lastAvailable: (_.isEmpty(nextProps.endpoint.last))? 'disabled':'',
            });
            if (!_.isEmpty(nextProps.endpoint.page)) {
                this.setState({
                    totalElements: nextProps.endpoint.page.totalElements,
                    totalPages: nextProps.endpoint.page.totalPages,
                    currentPage: nextProps.endpoint.page.number + 1
                })
            }
        }
    }

    loadEndpoint(url, pageSize) {
        this.props.fetchEndpoint(url.replace(/profile\//, ''), pageSize, this.state.sortName, this.state.sortDirection);
    }

    handleChange(e) {
        e.preventDefault();
        var pageSize = e.target.value;
        if (/^[0-9]+$/.test(pageSize)) {
            if (pageSize !== this.state.pageSize) {
                const { url } = this.props.location.state;
                this.loadEndpoint(url.replace(/profile\//, ''), pageSize);
            }
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
        this.setState({pageSize});
    }

    handleSort(key, e) {
        e.preventDefault();
        this.setState({
            sortDirection: ((this.state.sortDirection == 'desc') ? 'asc' : 'desc'),
            sortName: key || ''
        })
        this.loadEndpoint(this.props.location.state.url, this.state.pageSize);
    }

    handleFirst(e) {
        e.preventDefault();
        this.loadEndpoint(this.props.endpoint.first.href);

    }

    handleLast(e) {
        e.preventDefault();
        this.loadEndpoint(this.props.endpoint.last.href);
    }

    handleNext(e) {
        e.preventDefault();
        if (!_.isEmpty(this.props.endpoint.next.href)) {
            this.loadEndpoint(this.props.endpoint.next.href);
        }
    }

    handlePrev(e) {
        e.preventDefault();
        if (!_.isEmpty(this.props.endpoint.prev.href)) {
            this.loadEndpoint(this.props.endpoint.prev.href);
        }
    }

    handleCreateSuccess(response) {
        const { url } = this.props.location.state;
        this.loadEndpoint(url.replace(/profile\//, ''), this.state.pageSize);
        this.setState({
            alertVisible: true,
            headline: 'Created Entity for ' + this.props.match.params.endpoint,
            response: response
        })
    }

    handleUpdateSuccess(response) {
        const { url } = this.props.location.state;
        this.loadEndpoint(url.replace(/profile\//, ''), this.state.pageSize);
        this.setState({
            alertVisible: true,
            headline: 'Entity updated for ' + this.props.match.params.endpoint,
            response: response
        })
    }

    handleDeleteSuccess(response) {
        const { url } = this.props.location.state;
        this.loadEndpoint(url.replace(/profile\//, ''), this.state.pageSize);
        this.setState({
            alertVisible: true,
            headline: 'Entity deleted for ' + this.props.match.params.endpoint,
            response: response
        })
    }

    handleCreateEntry(newEntry) {
        const { url } = this.props.location.state;
        this.props.createEntry(url.replace(/profile\//, ''), newEntry, this.handleCreateSuccess);
    }

    handleUpdateEntry(url, updatedEntry) {
        this.props.updateEntry(url, updatedEntry, this.handleUpdateSuccess);
    }

    handleDeleteEntry(url) {
        this.props.deleteEntry(url, this.handleDeleteSuccess);
    }

    renderEndpoint() {
        var that = this;
        return _.map(this.props.endpoint.data, function(value, key) {
            if (!_.isEmpty(value)) {
                var names = _.map(that.props.endpoint_meta, function(v, k) {
                    return (
                        <td key={k}>{value[v]}</td>
                    )
                });
                return (
                    <tr key={key}>
                        <td>
                            <div className="btn-group" role="group">
                                <UpdateDialog attributes={that.props.endpoint_meta} entry={value} id={_.last(value._links.self.href.split("/"))} callback={that.handleUpdateSuccess} />
                                <DeleteDialog attributes={that.props.endpoint_meta} entry={value} callback={that.handleDeleteSuccess} />
                            </div>
                        </td>
                        {names}
                    </tr>
                )
            }
        });
    }

    renderEndpointHead() {
        var head = _.map(this.props.endpoint_meta, (value, key) => {
            return <th key={key}><button onClick={(e) => this.handleSort(value, e)} className="btn btn-sm btn-outline-secondary">{_.startCase(value)}</button></th>
        });
        return (
            <tr>
                <th><i className="material-icons">{(this.state.sortDirection == 'desc') ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</i></th>
                {head}
            </tr>
        )
    }

    renderTable() {
        if (!_.isEmpty(this.props.endpoint_meta)) {
            return (
                <table className="table table-hover table-bordered table-striped">
                    <thead>
                    {this.renderEndpointHead()}
                    </thead>
                    <tbody>
                    {this.renderEndpoint()}
                    </tbody>
                </table>
            )
        }
        return (
            <Spinner/>
        )
    }

    render() {

        if (this.props.endpoint == null) {
            return( <div>
                        <Back path={"/services/" + this.props.match.params.id}/>
                        <div className="alert alert-danger" role="alert">Endpoint is not hateoas</div>
                    </div>
                )
        }
        return (
            <div>
                <Back path={"/services/" + this.props.match.params.id}/>
                <Alert alertVisible={this.state.alertVisible} headline={this.state.headline} response={this.state.response} type={"alert-success"} />
                <h3>{"Endoint: " + this.props.match.params.endpoint}</h3>
                <div className="d-flex justify-content-between align-items-start">
                    <div className="p-4">
                        <div className="d-flex justify-content-start">
                            <div className="p-2">
                                <select className="form-control" value={this.state.pageSize} onChange={this.handleChange}>
                                    <option value="1">1</option>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            <div className="p-2">
                                <CreateDialog attributes={this.props.endpoint_meta} handleCreateEntry={this.handleCreateEntry}/>
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        <nav aria-label="Page navigation example">
                            <ul className="pagination">
                                <li className={"page-item " + this.state.firstAvailable}>
                                    <a className="page-link" href="" onClick={this.handleFirst} aria-label="Previous">
                                        <span aria-hidden="true">&laquo;</span>
                                        <span className="sr-only">Previous</span>
                                    </a>
                                </li>
                                <li className={"page-item " + this.state.prevAvailable}><a className="page-link" onClick={this.handlePrev} href="">&lsaquo;</a></li>
                                <li className={"page-item " + this.state.nextAvailable}><a className="page-link" onClick={this.handleNext} href="">&rsaquo;</a></li>
                                <li className={"page-item " + this.state.lastAvailable}>
                                    <a className="page-link" href="" onClick={this.handleLast} aria-label="Next">
                                        <span aria-hidden="true">&raquo;</span>
                                        <span className="sr-only">Next</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    <div className="p-4">
                        <span className="badge badge-pill badge-primary">{(this.state.currentPage) + " of " + this.state.totalPages + " pages"}</span>
                        <span className="badge badge-pill badge-primary">{this.state.totalElements + " entries"}</span>
                    </div>
                </div>
                {this.renderTable()}
            </div>
        )
    }
}
function mapStateToProps(state) {
    return { endpoint: state.endpoint, endpoints: state.endpoints, endpoint_meta: state.endpoint_meta };
}

export default connect(mapStateToProps, { fetchEndpoint, fetchEndpoints, fetchEndpointMeta, createEntry, updateEntry, deleteEntry})(EndpointShow);