import { h, render, patch } from './vdom'
const vnode = h('div', {}, 
  h('li', {key: 'A'}, 'A'),
  h('li', {key: 'B'}, 'B'),
  h('li', {key: 'C'}, 'C'),
  h('li', {key: 'D'}, 'D')
)
render(vnode, app)

const newVnode =  h('div', {}, 
h('li', {key: 'A'}, 'A1'),
h('li', {key: 'B'}, 'B1'),
h('li', {key: 'C'}, 'C1'),
h('li', {key: 'D'}, 'D1'),
)

setTimeout(() => {
  patch(newVnode, vnode)
}, 2000)

