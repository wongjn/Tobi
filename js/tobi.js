/**
 * Tobi
 *
 * @author rqrauhvmra
 * @version 1.7.1
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
      browserWindow = window,
      transformProperty = null,
      gallery = [],
      figcaptionId = 0,
      elementsLength = null,
      lightbox = null,
      overlay = null,
      slider = null,
      sliderElements = [],
      prevButton = null,
      nextButton = null,
      closeButton = null,
      counter = null,
      currentIndex = 0,
      drag = {},
      pointerDown = false,
      lastFocus = null,
      firstFocusableEl = null,
      lastFocusableEl = null,
      offset = null,
      offsetTmp = null,
      resizeTicking = false,
      x = 0

    /**
     * Merge default options with user options
     *
     * @param {Object} userOptions - User options
     * @returns {Object} - Custom options
     */
    var mergeOptions = function mergeOptions (userOptions) {
      // Default options
      var options = {
        items: [],
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
        threshold: 100
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

    var supported = {
      checkSupport: function (element) {
        return !element.hasAttribute('data-type') && element.href.match(/\.(png|jpe?g|tiff|tif|gif|bmp|webp|svg|ico)$/)
      },

      init: function (element, container) {
        var figure = document.createElement('figure'),
          figcaption = document.createElement('figcaption'),
          image = document.createElement('img'),
          thumbnail = element.querySelector('img'),
          loader = document.createElement('div')

        image.style.opacity = '0'

        if (thumbnail) {
          image.alt = thumbnail.alt || ''
        }

        image.setAttribute('src', '')
        image.setAttribute('data-src', element.href)

        // Add image to figure
        figure.appendChild(image)

        // Create figcaption
        if (config.captions) {
          figcaption.style.opacity = '0'

          if (config.captionsSelector === 'self' && element.getAttribute(config.captionAttribute)) {
            figcaption.textContent = element.getAttribute(config.captionAttribute)
          } else if (config.captionsSelector === 'img' && thumbnail && thumbnail.getAttribute(config.captionAttribute)) {
            figcaption.textContent = thumbnail.getAttribute(config.captionAttribute)
          }

          if (figcaption.textContent) {
            figcaption.id = 'tobi-figcaption-' + figcaptionId
            figure.appendChild(figcaption)

            image.setAttribute('aria-labelledby', figcaption.id)

            ++figcaptionId
          }
        }

        // Add figure to container
        container.appendChild(figure)

        //  Create loader
        loader.classList.add('tobi-loader')

        // Add loader to container
        container.appendChild(loader)

        // Register type
        container.setAttribute('data-type', 'image')
      },

      onPreload: function (container) {
        // Same as preload
        supported.onLoad(container)
      },

      onLoad: function (container) {
        var image = container.querySelector('img')

        if (!image.hasAttribute('data-src')) {
          return
        }

        var figcaption = container.querySelector('figcaption'),
          loader = container.querySelector('.tobi-loader')

        image.onload = function () {
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
    };

    /**
     * Init
     *
     */
    var init = function init (userOptions) {
      // Merge user options into defaults
      config = mergeOptions(userOptions)

      // Transform property supported by client
      transformProperty = transformSupport()

      // Saves the number of elements
      elementsLength = config.items.length

      // Create lightbox
      createLightbox()

      // Execute a few things once per element
      config.items.forEach(function (element) {
        initElement(element)
      })
    }

    /**
     * Init element
     *
     */
    var initElement = function initElement (element, isNewDynamicElement) {
      // Check if the lightbox already exists
      if (!lightbox) {
        // Create the lightbox
        createLightbox()
      }

      // Check if element already exists
      if (gallery.indexOf(element) === -1) {
        gallery.push(element)

        // Set zoom icon if necessary
        if (config.zoom && element.querySelector('img')) {
          var tobiZoom = document.createElement('div')

          tobiZoom.classList.add('tobi-zoom__icon')
          tobiZoom.innerHTML = config.zoomText

          element.classList.add('tobi-zoom')
          element.appendChild(tobiZoom)
        }

        // Bind click event handler
        element.addEventListener('click', function (event) {
          event.preventDefault()

          openLightbox(gallery.indexOf(this))
        })

        // Create the slide
        createLightboxSlide(element)

        if (isNewDynamicElement) {
          elementsLength++

          if (isOpen()) {
            updateCounter()
            updateOffset()
            updateFocus()
          }
        }
      } else {
        return console.log('Element already added to the lightbox.')
      }
    }

    /**
     * Create the lightbox
     *
     */
    var createLightbox = function createLightbox () {
      // Create lightbox container
      lightbox = document.createElement('div')
      lightbox.setAttribute('role', 'dialog')
      lightbox.setAttribute('aria-hidden', 'true')
      lightbox.classList.add('tobi')

      // Create overlay container
      overlay = document.createElement('div')
      overlay.classList.add('tobi__overlay')
      lightbox.appendChild(overlay)

      // Create slider container
      slider = document.createElement('div')
      slider.classList.add('tobi__slider')
      lightbox.appendChild(slider)

      // Create previous button
      prevButton = document.createElement('button')
      prevButton.classList.add('tobi__prev')
      prevButton.setAttribute('type', 'button')
      prevButton.setAttribute('aria-label', config.navLabel[0])
      prevButton.innerHTML = config.navText[0]
      lightbox.appendChild(prevButton)

      // Create next button
      nextButton = document.createElement('button')
      nextButton.classList.add('tobi__next')
      nextButton.setAttribute('type', 'button')
      nextButton.setAttribute('aria-label', config.navLabel[1])
      nextButton.innerHTML = config.navText[1]
      lightbox.appendChild(nextButton)

      // Create close button
      closeButton = document.createElement('button')
      closeButton.classList.add('tobi__close')
      closeButton.setAttribute('type', 'button')
      closeButton.setAttribute('aria-label', config.closeLabel)
      closeButton.innerHTML = config.closeText
      lightbox.appendChild(closeButton)

      // Create counter
      counter = document.createElement('div')
      counter.classList.add('tobi__counter')
      lightbox.appendChild(counter)

      // Resize event using requestAnimationFrame
      browserWindow.addEventListener('resize', function () {
        if (!resizeTicking) {
          resizeTicking = true
          browserWindow.requestAnimationFrame(function () {
            updateOffset()
            resizeTicking = false
          })
        }
      })

      document.body.appendChild(lightbox)
    }

    /**
     * Create a lightbox slide
     *
     */
    var createLightboxSlide = function createLightboxSlide (element) {
      if (supported.checkSupport(element)) {
        // Create slide elements
        var sliderElement = document.createElement('div'),
          sliderElementContent = document.createElement('div')

        sliderElement.classList.add('tobi__slider__slide')
        sliderElement.style.position = 'absolute'
        sliderElement.style.left = x * 100 + '%'
        sliderElementContent.classList.add('tobi__slider__slide__content')

        // Create type elements
        supported.init(element, sliderElementContent)

        // Add slide content container to slider element
        sliderElement.appendChild(sliderElementContent)

        // Add slider element to slider
        slider.appendChild(sliderElement)
        sliderElements.push(sliderElement)

        ++x
      }
    }

    /**
     * Open the lightbox
     *
     * @param {number} index - Item index to load
     */
    var openLightbox = function openLightbox (index) {
      if (lightbox.getAttribute('aria-hidden') === 'false') {
        return console.log('Tobi is already open.')
      }

      if (!config.scroll) {
        document.documentElement.classList.add('tobi-is-open')
        document.body.classList.add('tobi-is-open')
      }

      if (!index) {
        index = 0
      }

      // Hide buttons if necessary
      if (!config.nav || elementsLength === 1 || (config.nav === 'auto' && 'ontouchstart' in window)) {
        prevButton.setAttribute('aria-hidden', 'true')
        nextButton.setAttribute('aria-hidden', 'true')
      } else {
        prevButton.setAttribute('aria-hidden', 'false')
        nextButton.setAttribute('aria-hidden', 'false')
      }

      // Hide counter if necessary
      if (!config.counter || elementsLength === 1) {
        counter.setAttribute('aria-hidden', 'true')
      } else {
        counter.setAttribute('aria-hidden', 'false')
      }

      // Hide close if necessary
      if (!config.close) {
        closeButton.disabled = false
        closeButton.setAttribute('aria-hidden', 'true')
      }

      if (config.draggable) {
        slider.style.cursor = '-webkit-grab'
      }

      // Save the user’s focus
      lastFocus = document.activeElement

      // Set current index
      currentIndex = index

      // Clear drag
      clearDrag()

      // Bind events
      bindEvents()

      // Load slide
      load(currentIndex)
      preload(currentIndex + 1)
      preload(currentIndex - 1)

      updateOffset()
      updateCounter()
      lightbox.setAttribute('aria-hidden', 'false')

      updateFocus()
    }

    /**
     * Close the lightbox
     *
     */
    var closeLightbox = function closeLightbox () {
      if (lightbox.getAttribute('aria-hidden') === 'true') {
        return console.log('Tobi is already closed')
      }

      if (!config.scroll) {
        document.documentElement.classList.remove('tobi-is-open')
        document.body.classList.remove('tobi-is-open')
      }

      // Unbind events
      unbindEvents()

      leave()

      lightbox.setAttribute('aria-hidden', 'true')

      // Reenable the user’s focus
      lastFocus.focus()
    }

    /**
     * Preload slide
     *
     */
    var preload = function preload (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('.tobi__slider__slide__content')

      supported.onPreload(container)
    }

    /**
     * Load slide
     * Will be called when opening the lightbox or moving index
     *
     */
    var load = function load (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      supported.onLoad(container)
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
     * Leave slide
     * Will be called when closing the lightbox or moving index
     *
     */
    var leave = function leave () {
      for (var index = 0; index < elementsLength; index++) {
        var container = sliderElements[index].querySelector('.tobi__slider__slide__content')

        supported.onLeave(container)
      }
    }

    /**
     * Update the offset
     *
     */
    var updateOffset = function updateOffset () {
      offset = -currentIndex * window.innerWidth

      slider.style[transformProperty] = 'translate3d(' + offset + 'px, 0, 0)'
      offsetTmp = offset
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
      var focusableEls = null

      if (config.nav) {
        // Display the next and previous buttons
        prevButton.disabled = false
        nextButton.disabled = false

        if (elementsLength === 1) {
          // Hide the next and previous buttons if there is only one slide
          prevButton.disabled = true
          nextButton.disabled = true

          if (config.close) {
            closeButton.focus()
          }
        } else if (currentIndex === 0) {
          // Hide the previous button when the first slide is displayed
          prevButton.disabled = true
        } else if (currentIndex === elementsLength - 1) {
          // Hide the next button when the last slide is displayed
          nextButton.disabled = true
        }

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

      focusableEls = lightbox.querySelectorAll('button:not(:disabled)')
      firstFocusableEl = focusableEls[0]
      lastFocusableEl = focusableEls.length === 1 ? focusableEls[0] : focusableEls[focusableEls.length - 1]
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
        closeLightbox()
      } else {
        updateOffset()
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
      } else if (event.target === closeButton || (event.target.classList.contains('tobi__slider__slide') && !event.target.classList.contains('tobi__slider__slide__content'))) {
        closeLightbox()
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
        closeLightbox()
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

        slider.style[transformProperty] = 'translate3d(' + (offsetTmp - Math.round(drag.startX - drag.endX)) + 'px, 0, 0)'
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
     * Mousemove event handler
     *
     */
    var mousemoveHandler = function mousemoveHandler (event) {
      event.preventDefault()

      if (pointerDown) {
        drag.endX = event.pageX
        slider.style[transformProperty] = 'translate3d(' + (offsetTmp - Math.round(drag.startX - drag.endX)) + 'px, 0, 0)'
      }
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
     * Bind events
     *
     */
    var bindEvents = function bindEvents () {
      if (config.keyboard) {
        document.addEventListener('keydown', keydownHandler)
      }

      // Click events
      if (config.docClose) {
        lightbox.addEventListener('click', clickHandler)
      }

      prevButton.addEventListener('click', clickHandler)
      nextButton.addEventListener('click', clickHandler)
      closeButton.addEventListener('click', clickHandler)

      if (config.draggable) {
        // Touch events
        lightbox.addEventListener('touchstart', touchstartHandler)
        lightbox.addEventListener('touchmove', touchmoveHandler)
        lightbox.addEventListener('touchend', touchendHandler)

        // Mouse events
        lightbox.addEventListener('mousedown', mousedownHandler)
        lightbox.addEventListener('mouseup', mouseupHandler)
        lightbox.addEventListener('mousemove', mousemoveHandler)
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

      // Click events
      if (config.docClose) {
        lightbox.removeEventListener('click', clickHandler)
      }

      prevButton.removeEventListener('click', clickHandler)
      nextButton.removeEventListener('click', clickHandler)
      closeButton.removeEventListener('click', clickHandler)

      if (config.draggable) {
        // Touch events
        lightbox.removeEventListener('touchstart', touchstartHandler)
        lightbox.removeEventListener('touchmove', touchmoveHandler)
        lightbox.removeEventListener('touchend', touchendHandler)

        // Mouse events
        lightbox.removeEventListener('mousedown', mousedownHandler)
        lightbox.removeEventListener('mouseup', mouseupHandler)
        lightbox.removeEventListener('mousemove', mousemoveHandler)
      }
    }

    /**
     * Add an element dynamically to the lightbox
     *
     */
    var add = function add (element) {
      initElement(element, true)
    }

    /**
     * Reset the lightbox
     *
     */
    var remove = function remove () {
      lightbox.parentElement.removeChild(lightbox);
    }

    /**
     * Check if the lightbox is open
     *
     */
    var isOpen = function isOpen () {
      return lightbox.getAttribute('aria-hidden') === 'false'
    }

    init(userOptions)

    return {
      prev: prev,
      next: next,
      open: openLightbox,
      close: closeLightbox,
      add: add,
      remove: remove,
      isOpen: isOpen,
      version: '1.7.1'
    }
  }

  return Tobi
}))
