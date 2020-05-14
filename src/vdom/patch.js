
export function render(vnode, container) {
  const ele = createDomByVnode(vnode)
  container.appendChild(ele)
}
/*
  创建虚拟节点
**/
function createDomByVnode(vnode) {
  const { type, key, props, children = [], text} = vnode
  if (type) {
    // 标签
    vnode.domElement = document.createElement(type)
    updateProperties(vnode)
  } else {
    // 文本
    vnode.domElement = document.createTextNode(text)
  }
  // children的处理
  children && children.forEach(child => {
    return render(child, vnode.domElement)
  });
  return vnode.domElement // 在vnode中创建一个属性，映射真正的dom
}

/**
 * 更新属性
 * **/
function updateProperties(vnode, oldProps = {}) {
  const domElement = vnode.domElement
  const props = vnode.props
  // 老有, 新没有
  for(let oldPropsName in oldProps) {
    if (!props[oldPropsName]) {
      domElement.removeAttribute(oldPropsName)
    }
  }
  // 考虑style的情况, 老有新没有，删除新没有的属性
  const newStyle = vnode.props.style
  const oldStyle = props.style
  for(let k in oldStyle) {
    if(!newStyle[k]) {
      domElement.style[k] = ''
    }
  }
  // 老没有，新有
  for(let newPropsName in props) {
    if (newPropsName === 'style') {
      const styleObj = props.style
      for(let i in styleObj) {
        domElement.style[i] = styleObj[i]
      }
    } else {
      domElement.setAttribute(newPropsName, props[newPropsName])
    }
  }
}

function isSameNode(newVnode, oldVnode) {
  return newVnode.key === oldVnode.key && oldVnode.type === newVnode.type

}

/*比对更新属性
*/

export function patch(newVnode, oldVnode) { //geng

  // 标签不相同相同复用
  if (newVnode.type !== oldVnode.type) {
    return oldVnode.domElement.parentNode.replaceChild(createDomByVnode(newVnode), oldVnode.domElement)
  }
  // 文本
  if (newVnode.text !== oldVnode.text) {
    return oldVnode.domElement.textContent = newVnode.text
  }
  // 是标签，并且类型相同，根据新节点的属性更新旧节点
  const domElement = newVnode.domElement = oldVnode.domElement //节点复用
  // 更新属性
  updateProperties(newVnode, oldVnode.props)
  // 外层更新后，继续更新children
  const newChildren = newVnode.children
  const oldChildren = oldVnode.children
  /** 有三种情况
   * newChildren: 有， oldChildren：有 // 最复杂，比较，diff算法的核心
   * newChildren: 有， oldChildren：无 // 直接添加
   * newChildren: 无， oldChildren：有 //直接删除
  */
  if(newChildren.length > 0 && oldChildren.length > 0) {
    updeteChild(domElement, newChildren, oldChildren)
  } else if (newChildren.length > 0){
    // 新的有，直接循环添加
    for(let i = 0; i < newChildren.length; i++) {
      domElement.appendChild(createDomByVnode(newChildren[i]))
    }

  } else if (oldChildren.length > 0) {
    // 老的有，直接删除
    oldVnode.domElement.innerHTML = ''
  }
}

/** 
 * parent, 外层节点，方便操作内部的节点
 * newChildren新虚拟dom的儿子
 * oldChildren老虚拟dom的儿子
*/
function updeteChild(parent, newChildren, oldChildren) {
  // 采用列表比对， 会对常见的dom操作做优化：前后追加，正序和倒序
  // 定义头指针和尾指针
  let newStartIndex = 0
  let newStart = newChildren[0] // 新的开始虚拟节点
  let newEndIndex = newChildren.length - 1
  let newEnd = newChildren[newEndIndex]

  let oldStartIndex = 0
  let oldStart = oldChildren[0] // 新的开始虚拟节点
  let oldEndIndex = oldChildren.length - 1
  let oldEnd = oldChildren[newEndIndex]

  /* 情况：
  * 新的开始 == 老的开始
  * 新的开始 == 老的尾
  * 老的开始 == 新的尾
  * 老的尾 == 新的开始
  * 以上四种情况都不是
  */
  // 谁先满足就结束循环
  while(newStartIndex <= newEndIndex && oldStartIndex <= oldEndIndex) {
    if(isSameNode(newStart, oldStart)) {
      // 新的开始 == 老的开始，指针后移，更新属性
      patch(newStart, oldStart)
      newStart = newChildren[++newStartIndex]
      oldStart = oldChildren[++oldStartIndex]
    }
  }
  // 循环之后，新的如果有剩余
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      parent.appendChild(createDomByVnode(newChildren[i]))
    }
  }

}