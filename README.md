# gatsby-transformer-ceteicean

Transforms XML files for Custom Elements support via [CETEIcean](https://github.com/teic/ceteicean).

Each element in an XML file gets prefixed with a given prefix based on the element's namespace.

To facilitate use with CETEIcean, the transformer generates a list of prefixed elements and `data-origname` and `data-origatts` attributes are added to each element.

TEI XML is supported by default and TEI elements will be prefixed with `tei-`.

Supported extensions: `.xml`, `.odd`

## Install

Coming soon.

**Note:** You also need to have `gatsby-source-filesystem` installed and configured so it points to your files.

## How to use

In your `gatsby-config.js`:

```js
module.exports = {
  plugins: [
    `gatsby-transformer-ceteicean`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `./src/data/`,
      },
    },
  ],
}
```

Where the source folder `./src/data/` contains the `.xml` files.

## How to query

You can query the nodes using GraphQL like this:

```graphql
{
  allCetei {
    edges {
      node {
        original
        prefixed
        elements
      }
    }
  }
}
```

which would return:

```js
{
  allCetei: {
    edges: [
      {
        node: {
          original: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<TEI xmlns=\"http://www.tei-c.org/ns/1.0\"/>",
          prefixed: "<tei-TEI data-xmlns=\"http://www.tei-c.org/ns/1.0\" data-origname=\"TEI\" data-origatts=\"xmlns\">",
          elements: [
            "tei-TEI"
          ]
        },
      },
    ]
  }
}

```

### Configuration options

Non-TEI namespaces can be set on the plugin via options:

```js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-ceteicean`,
      options: {
        namespaces: {
          "http://www.music-encoding.org/ns/mei": "mei",
          "http://dita.​oasis-open.​org/​architecture/​2005/": "dita"
        }
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `./src/data/`,
      },
    },
  ],
}
```
