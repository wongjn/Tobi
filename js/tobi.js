/**
 * Tobi
 *
 * @author rqrauhvmra
 * @version 1.6.5
 * @url https://github.com/rqrauhvmra/Tobi
 *
 * MIT License
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    root.Tobi = factory()
  }
}(this, function () {
  'use strict'

  var Tobi = function Tobi (userOptions) {
    /**
     * Global variables
     *
     */
    var config = {},
      transformProperty,
      gallery = [],
      figcaptionId = 0,
      elementsLength,
      sliderElements = [],
      currentIndex,
      drag = {},
      pointerDown,
      lastFocus,
      firstFocusableEl,
      lastFocusableEl,
      offset

    /**
     * Create lightbox components
     *
     */
    var overlay = document.createElement('div')
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-hidden', 'true')
    overlay.classList.add('tobi-overlay')
    document.body.appendChild(overlay)

    var prevButton = document.createElement('button')
    prevButton.setAttribute('type', 'button')
    overlay.appendChild(prevButton)

    var slider = document.createElement('div')
    slider.classList.add('tobi-slider')
    overlay.appendChild(slider)

    var closeButton = document.createElement('button')
    closeButton.setAttribute('type', 'button')
    overlay.appendChild(closeButton)

    var counter = document.createElement('div')
    counter.classList.add('tobi-counter')
    overlay.appendChild(counter)

    var nextButton = document.createElement('button')
    nextButton.setAttribute('type', 'button')
    overlay.appendChild(nextButton)

    /**
     * types - you can add new type to support something new
     *
     */
    var supportedElements = {
      image: {
        checkSupport: function (element) {
          return !element.hasAttribute('data-type') && element.href.match(/\.(png|jpg|tiff|tif|gif|bmp|webp|svg|ico)$/)
        },

        init: function (element, container) {
          var image = document.createElement('img')

          image.style.opacity = '0'

          var thumbnail = element.querySelector('img')
          image.alt = thumbnail && thumbnail.alt ? thumbnail.alt : ''

          image.setAttribute('src', '')
          image.setAttribute('data-src', element.href)

          // Add image to figure
          container.appendChild(image)

          // Register type
          container.setAttribute('data-type', 'image')

          // Create figcaption
          if (config.captions) {
            var figcaption = document.createElement('figcaption')

            figcaption.style.opacity = '0'

            if (config.captionsSelector === 'self' && element.getAttribute(config.captionAttribute)) {
              figcaption.textContent = element.getAttribute(config.captionAttribute)
            } else if (config.captionsSelector === 'img' && thumbnail && thumbnail.getAttribute(config.captionAttribute)) {
              figcaption.textContent = thumbnail.getAttribute(config.captionAttribute)
            }

            if (figcaption.textContent) {
              figcaption.id = 'tobi-figcaption-' + figcaptionId
              container.appendChild(figcaption)

              image.setAttribute('aria-labelledby', figcaption.id)
            }
          }
        },

        onPreload: function (container) {
          // Same as preload
          supportedElements.image.onLoad(container)
        },

        onLoad: function (container) {
          var image = container.querySelector('img')

          if (!image.hasAttribute('data-src')) {
            return
          }

          var figcaption = container.querySelector('figcaption')
          var loaderHtml = document.createElement('div')

          loaderHtml.classList.add('tobi-loader')
          container.appendChild(loaderHtml)

          image.onload = function () {
            var loader = container.querySelector('.tobi-loader')

            container.removeChild(loader)
            image.style.opacity = '1'

            if (figcaption) {
              figcaption.style.opacity = '1'
            }
          }

          image.setAttribute('src', image.getAttribute('data-src'))
          image.removeAttribute('data-src')
        },

        onLeave: function (container) {
          // Nothing
        }
      },

      youtube: {
        checkSupport: function (element) {
          return checkType(element, 'youtube')
        },

        init: function (element, container) {
          // To do
        },

        onPreload: function (container) {
          // Nothing
        },

        onLoad: function (container) {
          // To do
        },

        onLeave: function (container) {
          // To do
        }
      },

      iframe: {
        checkSupport: function (element) {
          return checkType(element, 'iframe')
        },

        init: function (element, container) {
          // Create iframe
          var iframe = document.createElement('iframe')

          var href = element.hasAttribute('href') ? element.getAttribute('href') : element.getAttribute('data-target')

          iframe.setAttribute('frameborder', '0')
          iframe.setAttribute('src', '')
          iframe.setAttribute('data-src', href)

          // Add iframe to figure
          container.appendChild(iframe)

          // Register type
          container.setAttribute('data-type', 'iframe')
        },

        onPreload: function (container) {
          // Nothing
        },

        onLoad: function (container) {
          var iframe = container.querySelector('iframe')

          iframe.setAttribute('src', iframe.getAttribute('data-src'))
        },

        onLeave: function (container) {
          // Nothing
        }
      },

      html: {
        checkSupport: function (element) {
          return checkType(element, 'html')
        },

        init: function (element, container) {
          // Create HTML
          var div = document.createElement('div'),
            targetSelector = element.hasAttribute('href') ? element.getAttribute('href') : element.getAttribute('data-target'),
            target = document.querySelector(targetSelector)

          if (!target) {
            return console.log('Ups, I can\'t find the target ' + targetSelector + '.')
          }
          
          div.classList.add('tobi-html')

          // Copy content
          div.innerHTML = target.innerHTML

          // Hide original content
          target.style.display = 'none'

          // Add HTML to figure
          container.appendChild(div)

          // Register type
          container.setAttribute('data-type', 'html')
        },

        onPreload: function (container) {
          // Nothing
        },

        onLoad: function (container) {
          // Nothing
        },

        onLeave: function (container) {
          var video = container.querySelector('video')

          if (video) {
            // Stop if video was found
            video.pause()
          }
        }
      }
    }

    /**
     * Init
     *
     */
    var init = function init (userOptions) {
      // Merge user options into defaults
      config = mergeOptions(userOptions)

      // Transform property supported by client
      transformProperty = transformSupport()

      // Get a list of all elements within the document
      var elements = document.querySelectorAll(config.selector)

      // Saves the number of elements
      elementsLength = elements.length

      if (!elementsLength) {
        return console.log('Ups, I can\'t find the selector ' + config.selector + '.')
      }

      // Execute a few things once per element
      [].forEach.call(elements, function (element) {
        initElement(element)
      })
    }

    /**
     * Init element
     *
     */
    var initElement = function initElement (element) {
      if (gallery.indexOf(element) === -1) {
        gallery.push(element)
        element.classList.add('tobi')

        // Set zoom icon if necessary
        if (config.zoom && element.querySelector('img')) {
          var tobiZoom = document.createElement('div')

          tobiZoom.classList.add('tobi__zoom-icon')
          tobiZoom.innerHTML = config.zoomText

          element.classList.add('tobi--zoom')
          element.appendChild(tobiZoom)
        }

        // Bind click event handler
        element.addEventListener('click', function (event) {
          event.preventDefault()

          openOverlay(gallery.indexOf(this))
        })

        // Add element to gallery
        createOverlay(element)
      }
    }

    /**
     * Create overlay
     *
     */
    var createOverlay = function createOverlay (element) {
      var sliderElement = document.createElement('div'),
        figureWrapper = document.createElement('div'),
        figure = document.createElement('figure')
      sliderElement.classList.add('tobi-slide')

      // Set up figure wrapper
      figureWrapper.classList.add('tobi-figure-wrapper')

      // Set up figure
      figure.classList.add('tobi-figure')

      // Detect type
      for (var i in supportedElements) {
        if (supportedElements.hasOwnProperty(i)) {
          if (supportedElements[i].checkSupport(element)) {
            // Found it
  
            // Init
            supportedElements[i].init(element, figure)
            break
          }
        }
      }

      // Add figure to figure wrapper
      figureWrapper.appendChild(figure)

      // Add figure wrapper to slider element
      sliderElement.appendChild(figureWrapper)

      // Add slider element to slider
      slider.appendChild(sliderElement)
      sliderElements.push(sliderElement)

      ++figcaptionId

      // Hide buttons if necessary
      if (!config.nav || elementsLength === 1 || (config.nav === 'auto' && 'ontouchstart' in window)) {
        prevButton.setAttribute('aria-hidden', 'true')
        nextButton.setAttribute('aria-hidden', 'true')
      } else {
        prevButton.setAttribute('aria-hidden', 'false')
        prevButton.setAttribute('aria-label', config.navLabel[0])
        prevButton.innerHTML = config.navText[0]

        nextButton.setAttribute('aria-hidden', 'false')
        nextButton.setAttribute('aria-label', config.navLabel[1])
        nextButton.innerHTML = config.navText[1]
      }

      // Hide counter if necessary
      if (!config.counter || elementsLength === 1) {
        counter.setAttribute('aria-hidden', 'true')
      } else {
        counter.setAttribute('aria-hidden', 'false')
      }

      // Hide close if necessary
      if (!config.close) {
        closeButton.setAttribute('aria-hidden', 'true')
      } else {
        closeButton.setAttribute('aria-label', config.closeLabel)
        closeButton.innerHTML = config.closeText
      }

      if (config.draggable) {
        slider.style.cursor = '-webkit-grab'
      }
    }

    /**
     * Open overlay
     *
     * @param {number} index - Item index to load
     */
    var openOverlay = function openOverlay (index) {
      if (overlay.getAttribute('aria-hidden') === 'false') {
        return
      }

      if (!config.scroll) {
        document.documentElement.classList.add('tobi--is-open')
        document.body.classList.add('tobi--is-open')
      }

      if (!index) {
        index = 0
      }

      // Save last focused element
      lastFocus = document.activeElement

      firstFocusableEl = overlay.firstElementChild
      lastFocusableEl = overlay.lastElementChild

      // Set current index
      currentIndex = index

      // Clear drag
      clearDrag()

      // Bind events
      bindEvents()

      // Load element
      load(currentIndex)
      preload(currentIndex + 1)
      preload(currentIndex - 1)

      updateOffset()
      updateCounter()
      overlay.setAttribute('aria-hidden', 'false')

      updateFocus()
    }

    /**
     * Close overlay
     *
     */
    var closeOverlay = function closeOverlay () {
      if (overlay.getAttribute('aria-hidden') === 'true') {
        return
      }

      if (!config.scroll) {
        document.documentElement.classList.remove('tobi--is-open')
        document.body.classList.remove('tobi--is-open')
      }

      // Unbind events
      unbindEvents()

      leave()

      overlay.setAttribute('aria-hidden', 'true')

      // Focus
      lastFocus.focus()
    }

    /**
     * Preload resource
     *
     */
    var preload = function preload (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('figure')
      var type = container.getAttribute('data-type')

      supportedElements[type].onPreload(container)
    }

    /**
     * Load resource
     *
     */
    var load = function load (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('figure')
      var type = container.getAttribute('data-type')

      supportedElements[type].onLoad(container)
    }

    /**
     * Leave resource
     * Will be called when closing lightbox or moving index
     *
     */
    var leave = function leave () {
      for (var index = 0; index < elementsLength; index++) {
        var container = sliderElements[index].querySelector('figure')
        var type = container.getAttribute('data-type')

        supportedElements[type].onLeave(container)
      }
    }

    /**
     * Merge default options with user options
     *
     * @param {Object} userOptions - User options
     * @returns {Object} - Custom options
     */
    var mergeOptions = function mergeOptions (userOptions) {
      // Default options
      var options = {
        selector: '.lightbox',
        captions: true,
        captionsSelector: 'img',
        captionAttribute: 'alt',
        nav: 'auto',
        navText: ['<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>'],
        navLabel: ['Previous', 'Next'],
        close: true,
        closeText: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>',
        closeLabel: 'Close',
        counter: true,
        download: false,
        downloadText: '',
        downloadLabel: 'Download',
        keyboard: true,
        zoom: true,
        zoomText: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>',
        docClose: true,
        swipeClose: true,
        scroll: false,
        draggable: true,
        threshold: 20
      }

      if (userOptions) {
        Object.keys(userOptions).forEach(function (key) {
          options[key] = userOptions[key]
        })
      }

      return options
    }

    /**
     * Determine if browser supports unprefixed transform property
     *
     * @returns {string} - Transform property supported by client
     */
    var transformSupport = function transformSupport () {
      return typeof document.documentElement.style.transform === 'string' ? 'transform' : 'WebkitTransform'
    }

    /**
     * Update the offset
     *
     */
    var updateOffset = function updateOffset () {
      offset = -currentIndex * window.innerWidth

      slider.style[transformProperty] = 'translate3d(' + offset + 'px, 0, 0)'
      slider.setAttribute('data-offset', offset)
    }

    /**
     * Update the counter
     *
     */
    var updateCounter = function updateCounter () {
      counter.textContent = (currentIndex + 1) + '/' + elementsLength
    }

    /**
     * Set the focus to the next element
     *
     */
    var updateFocus = function updateFocus (direction) {
      if (config.nav) {
        nextButton.disabled, prevButton.disabled = currentIndex === elementsLength - 1 ? true : false

        if (!direction && !nextButton.disabled) {
          nextButton.focus()
        } else if (!direction && nextButton.disabled && !prevButton.disabled) {
          prevButton.focus()
        } else if (!nextButton.disabled && direction === 'right') {
          nextButton.focus()
        } else if (nextButton.disabled && direction === 'right' && !prevButton.disabled) {
          prevButton.focus()
        } else if (!prevButton.disabled && direction === 'left') {
          prevButton.focus()
        } else if (prevButton.disabled && direction === 'left' && !nextButton.disabled) {
          nextButton.focus()
        }
      } else if (config.close) {
        closeButton.focus()
      }
    }

    /**
     * Navigate to the next slide
     *
     */
    var next = function next () {
      // If not last
      if (currentIndex !== elementsLength - 1) {
        leave()
      }

      if (currentIndex < elementsLength - 1) {
        currentIndex++

        updateOffset()
        updateCounter()
        updateFocus('right')

        load(currentIndex)
        preload(currentIndex + 1)
      }
    }

    /**
     * Navigate to the previous slide
     *
     */
    var prev = function prev () {
      // If not first
      if (currentIndex > 0) {
        leave()
      }

      if (currentIndex > 0) {
        currentIndex--

        updateOffset()
        updateCounter()
        updateFocus('left')

        load(currentIndex)
        preload(currentIndex - 1)
      }
    }

    /**
     * Clear drag after touchend
     *
     */
    var clearDrag = function clearDrag () {
      drag = {
        startX: 0,
        endX: 0,
        startY: 0,
        endY: 0
      }
    }

    /**
     * Recalculate drag event
     *
     */
    var updateAfterDrag = function updateAfterDrag () {
      var movementX = drag.endX - drag.startX,
        movementY = drag.endY - drag.startY,
        movementXDistance = Math.abs(movementX),
        movementYDistance = Math.abs(movementY)

      if (movementX > 0 && movementXDistance > config.threshold && currentIndex > 0) {
        prev()
      } else if (movementX < 0 && movementXDistance > config.threshold && currentIndex !== elementsLength - 1) {
        next()
      } else if (movementY < 0 && movementYDistance > config.threshold && config.swipeClose) {
        closeOverlay()
      } else {
        offset = slider.getAttribute('data-offset')

        slider.style[transformProperty] = 'translate3d(' + offset + 'px, 0, 0)'
      }
    }

    /**
     * Click event handler
     *
     */
    var clickHandler = function clickHandler (event) {
      if (event.target === prevButton) {
        prev()
      } else if (event.target === nextButton) {
        next()
      } else if (event.target === closeButton || (event.target.classList.contains('tobi-figure-wrapper') && !event.target.classList.contains('tobi-figure'))) {
        closeOverlay()
      }

      event.stopPropagation()
    }

    /**
     * Keydown event handler
     *
     */
    var keydownHandler = function keydownHandler (event) {
      if (event.keyCode === 9) {
        // `TAB` Key: Navigate to the next/previous focusable element
        if (event.shiftKey) {
          // Step backwards in the tab-order
          if (document.activeElement === firstFocusableEl) {
            lastFocusableEl.focus()
            event.preventDefault()
          }
        } else {
          // Step forward in the tab-order
          if (document.activeElement === lastFocusableEl) {
            firstFocusableEl.focus()
            event.preventDefault()
          }
        }
      } else if (event.keyCode === 27) {
        // `ESC` Key: Close the lightbox
        event.preventDefault()
        closeOverlay()
      } else if (event.keyCode === 37) {
        // `PREV` Key: Navigate to the previous slide
        event.preventDefault()
        prev()
      } else if (event.keyCode === 39) {
        // `NEXT` Key: Navigate to the next slide
        event.preventDefault()
        next()
      }
    }

    /**
     * Touchstart event handler
     *
     */
    var touchstartHandler = function touchstartHandler (event) {
      event.stopPropagation()

      pointerDown = true

      drag.startX = event.touches[0].pageX
      drag.startY = event.touches[0].pageY
    }

    /**
     * Touchmove event handler
     *
     */
    var touchmoveHandler = function touchmoveHandler (event) {
      event.preventDefault()
      event.stopPropagation()

      if (pointerDown) {
        drag.endX = event.touches[0].pageX
        drag.endY = event.touches[0].pageY

        offset = slider.getAttribute('data-offset')

        slider.style[transformProperty] = 'translate3d(' + (offset - Math.round(drag.startX - drag.endX)) + 'px, 0, 0)'
      }
    }

    /**
     * Touchend event handler
     *
     */
    var touchendHandler = function touchendHandler (event) {
      event.stopPropagation()

      pointerDown = false

      if (drag.endX) {
        updateAfterDrag()
      }

      clearDrag()
    }

    /**
     * Mousedown event handler
     *
     */
    var mousedownHandler = function mousedownHandler (event) {
      event.preventDefault()
      event.stopPropagation()

      pointerDown = true
      drag.startX = event.pageX
      slider.style.cursor = '-webkit-grabbing'
    }

    /**
     * Mouseup event handler
     *
     */
    var mouseupHandler = function mouseupHandler (event) {
      event.stopPropagation()

      pointerDown = false
      slider.style.cursor = '-webkit-grab'

      if (drag.endX) {
        updateAfterDrag()
      }

      clearDrag()
    }

    /**
     * Mousemove event handler
     *
     */
    var mousemoveHandler = function mousemoveHandler (event) {
      event.preventDefault()

      if (pointerDown) {
        drag.endX = event.pageX
        slider.style.cursor = '-webkit-grabbing'

        offset = slider.getAttribute('data-offset')

        slider.style[transformProperty] = 'translate3d(' + (offset - Math.round(drag.startX - drag.endX)) + 'px, 0, 0)'
      }
    }

    /**
     * Bind events
     *
     */
    var bindEvents = function bindEvents () {
      if (config.keyboard) {
        document.addEventListener('keydown', keydownHandler)
      }

      if (config.docClose) {
        overlay.addEventListener('click', clickHandler)
      }

      prevButton.addEventListener('click', clickHandler)
      nextButton.addEventListener('click', clickHandler)
      closeButton.addEventListener('click', clickHandler)

      if (config.draggable) {
        // Touch events
        overlay.addEventListener('touchstart', touchstartHandler)
        overlay.addEventListener('touchmove', touchmoveHandler)
        overlay.addEventListener('touchend', touchendHandler)

        // Mouse events
        overlay.addEventListener('mousedown', mousedownHandler)
        overlay.addEventListener('mouseup', mouseupHandler)
        overlay.addEventListener('mousemove', mousemoveHandler)
      }
    }

    /**
     * Unbind events
     *
     */
    var unbindEvents = function unbindEvents () {
      if (config.keyboard) {
        document.removeEventListener('keydown', keydownHandler)
      }

      if (config.docClose) {
        overlay.removeEventListener('click', clickHandler)
      }

      prevButton.removeEventListener('click', clickHandler)
      nextButton.removeEventListener('click', clickHandler)
      closeButton.removeEventListener('click', clickHandler)

      if (config.draggable) {
        // Touch events
        overlay.removeEventListener('touchstart', touchstartHandler)
        overlay.removeEventListener('touchmove', touchmoveHandler)
        overlay.removeEventListener('touchend', touchendHandler)

        // Mouse events
        overlay.removeEventListener('mousedown', mousedownHandler)
        overlay.removeEventListener('mouseup', mouseupHandler)
        overlay.removeEventListener('mousemove', mousemoveHandler)
      }
    }

    /**
     * Checks whether element has requested data-type value
     *
     */
    var checkType = function checkType (element, type) {
      return element.getAttribute('data-type') === type
    }

    /**
     * Adds an element dynamically
     *
     */
    var add = function add (element) {
      initElement(element)
      elementsLength++
    }

    /**
     * Resets tobi
     *
     */
    var reset = function reset () {
      if (slider) {
        while (slider.firstChild) {
          slider.removeChild(slider.firstChild);
        }
      }
      gallery.length = sliderElements.length = elementsLength = figcaptionId = 0
    }

    init(userOptions)

    return {
      prev: prev,
      next: next,
      open: openOverlay,
      close: closeOverlay,
      add: add,
      reset: reset,
      version: '1.6.4'
    }
  }

  return Tobi
}))
