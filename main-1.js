import { createElement, render, Component } from './toy-react'

class MyComponent extends Component {
    constructor() {
        super();
        this.state = {
            a: 1,
            b: 2,
        }
    }

    render() {
        return <div>
            <h1>myCompopnent</h1>
            <button onclick={() => { this.setState({ a: this.state.a + 1 }) }}>add</button>
            <p>{this.state.a.toString()}</p>
            <p>{this.state.b.toString()}</p>
            {this.children}
        </div>
    }
}

// var a = <div id="a" class="b">
//     <div></div>
//     <div></div>
// </div>

// document.body.appendChild(a)

render(<MyComponent id="a" class="b">
    <div>abc</div>
    <div></div>
</MyComponent>, document.body)