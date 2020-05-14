/** 
 * 将真实dom转为虚拟dom
*/
import { vnode } from './vnode'

export default function creatElement(type, props, ...children) {
  let key;
  if (props.key) {
    key = props.key
    delete props.key
  }
  children = children.map(child => {
    if  (typeof child === 'string') {
      return vnode(null,null,null,null, child)
    } else {
      return child
    }
  })
  return vnode(type, key, props, children)
}


