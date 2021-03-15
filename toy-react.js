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
    // get root() {
    //     if (!this._root) {
    //         this._root = this.render().root;
    //     }
    //     return this._root;
    // }
    get vdom() {
        return this.render().vdom // 这是一个递归的调用
    }
    // get vchildren() {
    //     return this.children.map(child => child.vdom)
    // }
    [RENDER_TO_DOM](range) {
        this._range = range
        this._vdom = this.vdom
        // this.render()[RENDER_TO_DOM](range)
        this._vdom[RENDER_TO_DOM](range)
    }
    // 如何实现vdom比对
    update() {
        let isSameNode = (oldNode, newNode) => {
            // 类型不同
            if (oldNode.type !== newNode.type) {
                return false
            }
            // 属性不同
            for (let name in newNode.props) {
                if (newNode.props[name] !== oldNode.props[name]) {
                    return false
                }
            }
            // 属性长度不同
            if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
                return false
            }
            // 文本节点内容不同
            if (newNode.type === '#text') {
                if (newNode.content !== oldNode.content) {
                    return false
                }
            }
                
            return true;
        }
        // 递归去访问vdom的内容
        let update = (oldNode, newNode) => {
            // type props children
            // #text content
            if (!isSameNode(oldNode, newNode)) {
                newNode[RENDER_TO_DOM](oldNode._range);
                return
            }
            newNode._range = oldNode._range

            let newChildren = newNode.vchildren
            let oldChildren = oldNode.vchildren

            if (!newChildren || !newChildren.length) {
                return
            }
            
            let tailRange = oldChildren[oldChildren.length - 1]._range

            for (let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i]
                let oldChild = oldChildren[i]
                if (i < oldChildren.length) {
                    update(oldChild, newChild)
                } else {
                    let range = document.createRange()
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);
                    newChild[RENDER_TO_DOM](range)
                    tailRange = range
                }
            }
        }

        let vdom = this.vdom
        update(this._vdom, vdom);
        this._vdom = vdom
    }
    // 重新绘制算法
    // rerender() {
    //     let oldRange = this._range

    //     let range = document.createRange()
    //     range.setStart(oldRange.startContainer, oldRange.startOffset)
    //     range.setEnd(oldRange.startContainer, oldRange.startOffset)
    //     this[RENDER_TO_DOM](range) 

    //     oldRange.setStart(range.endContainer, range.endOffset)
    //     oldRange.deleteContents();
    // }
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
        // this.rerender()
        this.update()
    }
}

class ElementWrapper extends Component {
    constructor(type) {
        super(type)
        this.type = type
        // root = document.createElement(type)
    }
    // setAttribute(name, value) {
    //     // 过滤一下name，如果name是以on开头的，需要做特殊处理
    //     if (name.match(/^on([\s\S]+)$/)) {
    //         // RegExp.$1 就匹配到了值
    //         root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    //     } else {
    //         if (name === 'className') {
    //             root.setAttribute('class', value)
    //         } else {
    //             root.setAttribute(name, value)
    //         }
    //     }
    // }
    // appendChild(component) {
    //     // root.appendChild(component.root)
    //     let range = document.createRange()
    //     range.setStart(root, root.childNodes.length)
    //     range.setEnd(root, root.childNodes.length)
    //     component[RENDER_TO_DOM](range)
    // }
    get vdom() {
        this.vchildren = this.children.map(child => child.vdom)
        return this
        // 如果返回的对象没有方法，就没有办法处理重绘
        // return {
        //     type: this.type,
        //     props: this.props,
        //     children: this.children.map(child => child.vdom)
        // }
    }
    [RENDER_TO_DOM](range) {
        this._range = range
        // this.render()[RENDER_TO_DOM](range)

        // 需要自己建root
        let root = document.createElement(this.type)
        for (let name in this.props) {
            let value = this.props[name]
            // 过滤一下name，如果name是以on开头的，需要做特殊处理
            if (name.match(/^on([\s\S]+)$/)) {
                // RegExp.$1 就匹配到了值
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else {
                if (name === 'className') {
                    root.setAttribute('class', value)
                } else {
                    root.setAttribute(name, value)
                }
            } 
        }

        if (!this.vchildren) {
            this.vchildren = this.children.map(child => child.vdom)
        }

        for (let child of this.vchildren) {
            let childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length)
            childRange.setEnd(root, root.childNodes.length)
            child[RENDER_TO_DOM](childRange) 
        }

        replaceContent(range, root)
        // range.insertNode(root)
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content)
        this.type = '#text'
        this.content = content
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
        this._range = range
        let root = document.createTextNode(this.content)
        replaceContent(range, root)
    }
}

function replaceContent(range, node) {
    range.insertNode(node)
    range.setStartAfter(node)
    range.deleteContents()

    range.setStartBefore(node)
    range.setEndAfter(node)
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