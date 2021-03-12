const RENDER_TO_DOM = Symbol('render to dom');

export class Component {
    constructor() {
        this.props = Object.create(null) // 创建一个绝对空的对象
        this.children = []
        this._root = null
        this._range = null // 初始化
    }
    setAttribute(name, value) {
        this.props[name] = value
    }
    appendChild(component) {
        this.children.push(component)
    }
    [RENDER_TO_DOM](range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }
    // get root() {
    //     if (!this._root) {
    //         this._root = this.render().root;
    //     }
    //     return this._root;
    // }
    get vdom() {
        return this.render().vdom // 这是一个递归的调用
    }
    get vchildren() {
        return this.children.map(child => child.vdom)
    }
    // 重新绘制算法
    rerender() {
        let oldRange = this._range

        let range = document.createRange()
        range.setStart(oldRange.startContainer, oldRange.startOffset)
        range.setEnd(oldRange.startContainer, oldRange.startOffset)
        this[RENDER_TO_DOM](range) 

        oldRange.setStart(range.endContainer, range.endOffset)
        oldRange.deleteContents();
    }
    setState(newState) {
        if (this.state === null || typeof this.state !== 'object') {
            // 这里是一个短路逻辑
            this.state = newState;
            this.rerender()
            return 
        }

        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (oldState[p] === null || typeof oldState[p] !== 'object') {
                    oldState[p] = newState[p]
                } else {
                    // 深拷贝
                    merge(oldState[p], newState[p])
                }
            }
        }
        merge(this.state, newState)
        this.rerender()
    }
}

class ElementWrapper extends Component {
    constructor(type) {
        super(type)
        this.type = type
        // this.root = document.createElement(type)
    }
    // setAttribute(name, value) {
    //     // 过滤一下name，如果name是以on开头的，需要做特殊处理
    //     if (name.match(/^on([\s\S]+)$/)) {
    //         // RegExp.$1 就匹配到了值
    //         this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    //     } else {
    //         if (name === 'className') {
    //             this.root.setAttribute('class', value)
    //         } else {
    //             this.root.setAttribute(name, value)
    //         }
    //     }
    // }
    // appendChild(component) {
    //     // this.root.appendChild(component.root)
    //     let range = document.createRange()
    //     range.setStart(this.root, this.root.childNodes.length)
    //     range.setEnd(this.root, this.root.childNodes.length)
    //     component[RENDER_TO_DOM](range)
    // }
    get vdom() {
        return this
        // return {
        //     type: this.type,
        //     props: this.props,
        //     children: this.children.map(child => child.vdom)
        // }
    }
    [RENDER_TO_DOM](range) {
        // this.render()[RENDER_TO_DOM](range)
        range.deleteContents()
        range.insertNode(this.root)
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content)
        this.type = '#text'
        this.content = content
        this.root = document.createTextNode(content)
    }
    get vdom() {
        return this
        // return {
        //     type: '#text',
        //     content: this.content
        // }
    }
    [RENDER_TO_DOM](range) {
        // this.render()[RENDER_TO_DOM](range)
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export function createElement(type, attributes, ...children) {
    let e;
    if (typeof type === 'string') {
        e = new ElementWrapper(type)
    } else {
        e = new type
    }

    for (let p in attributes) {
        e.setAttribute(p, attributes[p])
    }

    let insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            }
            if (child === null) {
                continue
            }
            if (typeof child === 'object' && child instanceof Array) {
                insertChildren(child)
            } else {
                e.appendChild(child)
            }
        }
    }

    insertChildren(children)
    return e
}

export function render(component, parentElement) {
    // parentElement.appendChild(component.root)
    let range = document.createRange()
    range.setStart(parentElement, 0)
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    component[RENDER_TO_DOM](range)
}