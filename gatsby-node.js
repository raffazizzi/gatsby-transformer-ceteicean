const { DOMParser, XMLSerializer } = require(`xmldom`)

async function onCreateNode({ node, actions, loadNodeContent, createNodeId, createContentDigest }, pluginOptions) {

  if (
    [`application/xml`, `text/xml`].includes(node.internal.mediaType)
    || [`xml`, `odd`].includes(node.extension)) {

    const options = pluginOptions || {}
    const { createNode, createParentChildLink } = actions

    const content = await loadNodeContent(node)

    const xml = new DOMParser().parseFromString(content, 'text/xml')

    const defaultNamespaces = {
      "http://www.tei-c.org/ns/1.0": "tei",
      "http://www.tei-c.org/ns/Examples": "teieg"
    }
    const namespaces = options.namespaces || defaultNamespaces

    const transformed = transform(xml, namespaces)
    const prefixed = new XMLSerializer().serializeToString(transformed.data)

    const obj = {
      original: content,
      prefixed,
      elements: transformed.elements
    }

    const id = createNodeId(`${node.id}-CETEI`)

    const ceteiNode = {
      ...obj,
      id,
      children: [],
      parent: node.id,
      internal: {
        content: prefixed,
        contentDigest: createContentDigest({obj}),
        type: `CETEI`,
      },
    }
    createNode(ceteiNode)
    createParentChildLink({ parent: node, child: ceteiNode })

  }
}

function getAttributeNames(el) {
  const attrs = el.attributes
  const names = []
  for(var i = attrs.length - 1; i >= 0; i--) {
    names.push(attrs[i].name)
  }
  return names
}

function transform(dom, namespaces){

  const elements = new Set()

  const convertEl = (el) => {

    let newElement
    const ns = el.namespaceURI ? el.namespaceURI : ""
    if (namespaces.hasOwnProperty(ns)) {
      const prefix = namespaces[ns]
      newElement = dom.createElement(`${prefix}-${el.localName}`)
      elements.add(`${prefix}-${el.localName}`)
    } else {
      newElement = dom.importNode(el, false)
      elements.add(`${prefix}-${el.localName}`)
    }
    // Copy attributes @xmlns, @xml:id, @xml:lang, and
    // @rendition get special handling.
    for (const att of Array.from(el.attributes)) {
        if (att.name == "xmlns") {
          //Strip default namespaces, but hang on to the values
          newElement.setAttribute("data-xmlns", att.value)
        } else {
          newElement.setAttribute(att.name, att.value)
        }
        if (att.name == "xml:id") {
          newElement.setAttribute("id", att.value)
        }
        if (att.name == "xml:lang") {
          newElement.setAttribute("lang", att.value)
        }
        if (att.name == "rendition") {
          newElement.setAttribute("class", att.value.replace(/#/g, ""))
        }
    }
    // Preserve element name so we can use it later
    newElement.setAttribute("data-origname", el.localName)
    if (el.hasAttributes()) {
      newElement.setAttribute("data-origatts", getAttributeNames(el).join(" "))
    }
    // If element is empty, flag it
    if (el.childNodes.length == 0) {
      newElement.setAttribute("data-empty", "")
    }
    // Turn <rendition scheme="css"> elements into HTML styles
    if (el.localName == "tagsDecl") {
      let style = dom.createElement("style")
      for (let node of Array.from(el.childNodes)){
        if (node.nodeType == 1 && node.localName == "rendition" && node.getAttribute("scheme") == "css") {
          let rule = ""
          if (node.hasAttribute("selector")) {
            //rewrite element names in selectors
            rule += node.getAttribute("selector").replace(/([^#, >]+\w*)/g, "tei-$1").replace(/#tei-/g, "#") + "{\n"
            rule += node.textContent
          } else {
            rule += "." + node.getAttribute("xml:id") + "{\n"
            rule += node.textContent
          }
          rule += "\n}\n"
          style.appendChild(dom.createTextNode(rule))
        }
      }
      if (style.childNodes.length > 0) {
        newElement.appendChild(style)
      }
    }
    for (let node of Array.from(el.childNodes)) {
        if (node.nodeType == 1) {
            newElement.appendChild(convertEl(node))
        }
        else {
            newElement.appendChild(node.cloneNode())
        }
    }
    return newElement
  }

  return {
    data: convertEl(dom.documentElement),
    elements: Array.from(elements)
  }
}

exports.onCreateNode = onCreateNode
exports.onPreInit = () => console.log("Loaded gatsby-transformer-ceteicean")
