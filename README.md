# Tobi

An accessible, simple and light-weight open source lightbox script with no dependencies.

![.flex__*](https://rqrauhvmra.com/tobi/snapshot.png)

## Features

- No dependencies
- Simple and light-weight
- Accessible:
  - ARIA roles
  - Keyboard navigation:
    - `Prev`/`Next` Keys: Navigate through items
    - `ESCAPE` Key: Close the lightbox
    - `TAB` Key: Focus elements within the lightbox, not outside
  - When the lightbox opens, focus is set to the first focusable element in the lightbox
  - When the lightbox closes, focus returns to what was in focus before the lightbox opened
  - Touch gestures: Drag/Swipe to navigate through items, close the lightbox with a vertical drag/swipe
- Support for images, iframes and inline HTML

## Get Tobi

### Download

CSS: `css/tobi.min.css` minified, or `css/tobi.css` un-minified

JavaScript: `js/tobi.min.js` minified, or `js/tobi.js` un-minified

### Package managers

Tobi is also available on npm.

`$ npm install wongjn/tobi --save`

## Usage

You can install Tobi by linking the `.css` and `.js` files to your html file. The HTML code may look like this:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your page title</title>

  <!-- CSS -->
  <link href="tobi.min.css" rel="stylesheet">
</head>
<body>
  <!-- Your HTML content -->

  <!-- JS -->
  <script src="tobi.min.js"></script>
</body>
</html>
```

Initialize the script by running:

```js
const tobi = new Tobi({
  items: listOfHTMLElements,
});
```

## Items

Each element passed in the `items` parameter must have the full image in `href`
property of its corresponding JavaScript object.

```html
<a href="path/to/image.jpg">
  <img src="path/to/thumbnail.jpg" alt="I am a caption">
</a>
```

## Options

The following options are available:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| items | Node[] | []] | Elements to be added into the lightbox, required. |
| captions | bool | true | Display captions, if available. |
| captionsSelector | "self", "img" | "img" | Set the element where the caption is. Set it to "self" for the `a` tag itself |
| captionAttribute | string | "alt" | Get the caption from given attribute. |
| nav | bool, "auto" | "auto" | Display navigation buttons. "auto" hides buttons on touch-enabled devices. |
| navText | string | ["inline svg", "inline svg"] | Text or HTML for the navigation buttons. |
| navLabel | string | ["Previous", "Next"] | ARIA label for screen readers |
| close | bool | true | Display close button. |
| closeText | string | "inline svg" | Text or HTML for the close button. |
| closeLabel | string | "Close" | ARIA label for screen readers. |
| counter | bool | true | Display current image index |
| keyboard | bool | true | Allow keyboard navigation. |
| zoom | bool | true | Display zoom icon. |
| zoomText | string | "inline svg" | Text or HTML for the zoom icon |
| docClose | bool | true | Closes the lightbox when clicking outside |
| swipeClose | bool | true | Swipe up to close lightbox |
| scroll | bool | false | Hide scrollbars if lightbox is displayed |
| draggable | bool | true | Use dragging and touch swiping |
| threshold | number | 100 | Touch and mouse dragging threshold (in px) |

## API

```javascript
var tobi = new Tobi({
  // Options
})

tobi.open()   // Opens the lightbox
tobi.open(2)  // Opens the lightbox on slide 3 (first is 0)
tobi.next()   // Shows the next slide in the lightbox
tobi.prev()   // Shows the previous slide in the lightbox
tobi.close()  // Closes the lightbox
tobi.remove() // Removes the lightbox from the dom

// Adds an element dynamically, even if the lightbox is open
var newElement = document.querySelector('.new-image')
tobi.add(newElement)

tobi.isOpen() // Checks if the lightbox is open
```

## Browser support

Tobi has been tested in the following browsers (all the latest versions):

- Chrome
- Firefox
- Internet Explorer
- Edge
- Safari

## Missing stuff

- Possibility to group

## Contributing

- Report issues
- Open pull request with improvements
- Spread the word

## Notes

If you do anything interesting with this code, please let me know. I'd love to see it.
