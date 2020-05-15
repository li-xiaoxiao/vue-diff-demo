
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
function oldmap(arr) {
  return arr.reduce((acc, [item, index]) => {
    const {key} = item
    key ? acc[key] = index : null
    return acc
  }, {})
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
  let oldChildrenMap = oldmap(oldChildren)

  /* 情况：
  * 新的开始 == 老的开始
  * 新的开始 == 老的尾
  * 老的开始 == 新的尾
  * 老的尾 == 新的开始
  * 以上四种情况都不是
  */
  // 谁先满足就结束循环
  while(newStartIndex <= newEndIndex && oldStartIndex <= oldEndIndex) {
    if (!oldStart) {
      // 排除undefined的情况
      oldStart = oldChildren[++oldStartIndex]
    } else if(!oldEnd) {
      oldEnd = oldChildren[--oldEndIndex]
    } else if(isSameNode(newStart, oldStart)) {
      // 新的开始 == 老的开始，头指针后移，更新属性
      patch(newStart, oldStart)
      newStart = newChildren[++newStartIndex]
      oldStart = oldChildren[++oldStartIndex]
    } else if (isSameNode(newEnd, oldEnd)) {
      // 新的尾 == 老的尾，尾指针前移，更新属性
      patch(newEnd, oldEnd)
      newEnd = newChildren[--newEndIndex]
      oldEnd = oldChildren[--oldEndIndex]
    } else if(isSameNode(newStart, oldEnd)) {
       // 新的开始 == 老的尾， 新的头指针后移， 老的尾指针前移
       patch(newStart, oldEnd)
       parent.insertBefore(oldEnd.domElement, oldStart.domElement)
       newStart = newChildren[++newStartIndex]
       oldEnd = oldChildren[--oldEndIndex]
     } else if(isSameNode(newEnd, oldStart)) {
      // 新的尾 == 老的开始， 新的尾指针前移， 老的头指针后移
      patch(newEnd, oldStart)
      parent.insertBefore(oldStart.domElement, oldEnd.domElement.nextSiblings)
      newEnd = newChildren[--newEndIndex]
      oldStart = oldChildren[++oldStartIndex]
    } else {
      // 都不一样，则要建立一个老children中key和元素的映射,遍历新的每一个，如果在老的存在就复用，不存在就创建
      const index = oldChildrenMap[newStart.key]
      if (index) {
        // 复用
        patch(newStart, oldChildren(index))
        parent.insertBefore(oldChildren[index].domElement, oldStartIndex.domElement)
        oldChildren[index] = null
        
      } else {
        // 创建
        parent.insertBefore(createDomByVnode(newStart), oldStart.domElement)
      }
      newStart = newChildren[++newStartIndex]
    }
  }
  // 循环之后，新的如果有剩余
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 如果遍历之后， i+1个元素有值则是向前追加元素， 否则是向后插入元素
      const beforeElement = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].domElement
      beforeElement.domElement.insertBefore(createDomByVnode(creanewChildren[i]), beforeElement)
    }
  }
  // 如果老的有剩余，则删除
  if (oldIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      // 删除
      if (oldChildred[i].domElement) {
        parent.removeChild(oldChildred[i].domElement)
      }
    }
  }
}