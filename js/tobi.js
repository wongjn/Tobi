/**
 * Tobi
 *
 * @author rqrauhvmra
 * @version 1.7.4
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
      elementsLength = 0,
      lightbox = null,
      slider = null,
      sliderElements = [],
      prevButton = null,
      nextButton = null,
      closeButton = null,
      counter = null,
      currentIndex = 0,
      drag = {},
      draggingX = false,
      draggingY = false,
      swipingX = false,
      swipingY = false,
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
     * @param {Object} userOptions - Optional user options
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
        navText: ['<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewbox="0 0 24 24"><polyline points="14 18 8 12 14 6 14 6"></polyline></svg>', '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewbox="0 0 24 24"><polyline points="10 6 16 12 10 18 10 18"></polyline></svg>'],
        navLabel: ['Previous', 'Next'],
        close: true,
        closeText: '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewbox="0 0 24 24"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"></path></svg>',
        closeLabel: 'Close',
        loadingIndicatorLabel: 'Image loading',
        counter: true,
        download: false, // TODO
        downloadText: '', // TODO
        downloadLabel: 'Download', // TODO
        keyboard: true,
        zoom: true,
        zoomText: '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4,20 L9.58788778,14.4121122"></path><path d="M14,16 C10.6862915,16 8,13.3137085 8,10 C8,6.6862915 10.6862915,4 14,4 C17.3137085,4 20,6.6862915 20,10 C20,13.3137085 17.3137085,16 14,16 Z"></path><path d="M16.6666667 10L11.3333333 10M14 7.33333333L14 12.6666667"></path></svg>',
        docClose: true,
        swipeClose: true,
        scroll: false,
        draggable: true,
        threshold: 100,
        rtl: false, // TODO
        loop: false, // TODO
        autoplayVideo: false
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
     * Types - you can add new type to support something new
     *
     */
    var supportedElements = {
      image: {
        checkSupport: function (element) {
          return !element.hasAttribute('data-type') && element.href.match(/\.(png|jpe?g|tiff|tif|gif|bmp|webp|svg|ico)$/)
        },

        init: function (element, container) {
          var figure = document.createElement('figure'),
            figcaption = document.createElement('figcaption'),
            image = document.createElement('img'),
            thumbnail = element.querySelector('img'),
            loadingIndicator = document.createElement('div')

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

          // Create loading indicator
          loadingIndicator.className = 'tobi-loader'
          loadingIndicator.setAttribute('role', 'progressbar')
          loadingIndicator.setAttribute('aria-label', config.loadingIndicatorLabel)

          // Add loading indicator to container
          container.appendChild(loadingIndicator)

          // Register type
          container.setAttribute('data-type', 'image')
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

          var figcaption = container.querySelector('figcaption'),
            loadingIndicator = container.querySelector('.tobi-loader')

          image.onload = function () {
            container.removeChild(loadingIndicator)
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
        },

        onCleanup: function (container) {
          // Nothing
        }
      },

      youtube: {
        checkSupport: function (element) {
          return checkType(element, 'youtube')
        },

        init: function (element, container) {
          // TODO
        },

        onPreload: function (container) {
          // Nothing
        },

        onLoad: function (container) {
          // TODO
        },

        onLeave: function (container) {
          // TODO
        },

        onCleanup: function (container) {
          // Nothing
        }
      },

      iframe: {
        checkSupport: function (element) {
          return checkType(element, 'iframe')
        },

        init: function (element, container) {
          var iframe = document.createElement('iframe'),
            href = element.hasAttribute('href') ? element.getAttribute('href') : element.getAttribute('data-target')

          iframe.setAttribute('frameborder', '0')
          iframe.setAttribute('src', '')
          iframe.setAttribute('data-src', href)

          // Add iframe to container
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
        },

        onCleanup: function (container) {
          // Nothing
        }
      },

      html: {
        checkSupport: function (element) {
          return checkType(element, 'html')
        },

        init: function (element, container) {
          var targetSelector = element.hasAttribute('href') ? element.getAttribute('href') : element.getAttribute('data-target'),
            target = document.querySelector(targetSelector)

          if (!target) {
            throw new Error('Ups, I can\'t find the target ' + targetSelector + '.')
          }

          // Add content to container
          container.appendChild(target)

          // Register type
          container.setAttribute('data-type', 'html')
        },

        onPreload: function (container) {
          // Nothing
        },

        onLoad: function (container) {
          var video = container.querySelector('video')

          if (video) {
            if (video.hasAttribute('data-time') && video.readyState > 0) {
              // Continue where video was stopped
              video.currentTime = video.getAttribute('data-time')
            }

            if (config.autoplayVideo) {
              // Start playback (and loading if necessary)
              video.play()
            }
          }
        },

        onLeave: function (container) {
          var video = container.querySelector('video')

          if (video) {
            if (!video.paused) {
              // Stop if video is playing
              video.pause()
            }

            // Backup currentTime (needed for revisit)
            if (video.readyState > 0) {
              video.setAttribute('data-time', video.currentTime)
            }
          }
        },

        onCleanup: function (container) {
          var video = container.querySelector('video')

          if (video) {
            if (video.readyState > 0 && video.readyState < 3 && video.duration !== video.currentTime) {
              // Some data has been loaded but not the whole package.
              // In order to save bandwidth, stop downloading as soon as possible.
              var clone = video.cloneNode(true)

              removeSources(video)
              video.load()

              video.parentNode.removeChild(video)

              container.appendChild(clone)
            }
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

      if (!elements) {
        throw new Error('Ups, I can\'t find the selector ' + config.selector + '.')
      }

      // Execute a few things once per element
      Array.prototype.forEach.call(elements, function (element) {
        add(element)
      })
    }

    /**
     * Add element
     *
     * @param {HTMLElement} element - Element to add
     * @param {function} callback - Optional callback to call after add
     */
    var add = function add (element, callback) {
      // Check if the lightbox already exists
      if (!lightbox) {
        // Create the lightbox
        createLightbox()
      }

      // Check if element already exists
      if (gallery.indexOf(element) === -1) {
        gallery.push(element)
        elementsLength++

        // Set zoom icon if necessary
        if (config.zoom && element.querySelector('img')) {
          var tobiZoom = document.createElement('div')

          tobiZoom.className = 'tobi-zoom__icon'
          tobiZoom.innerHTML = config.zoomText

          element.classList.add('tobi-zoom')
          element.appendChild(tobiZoom)
        }

        // Bind click event handler
        element.addEventListener('click', function (event) {
          event.preventDefault()

          open(gallery.indexOf(this))
        })

        // Create the slide
        createLightboxSlide(element)

        if (isOpen()) {
          updateLightbox()
        }

        if (callback) {
          callback.call(this)
        }
      } else {
        throw new Error('Ups, element already added to the lightbox.')
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
      lightbox.className = 'tobi'

      // Create slider container
      slider = document.createElement('div')
      slider.className = 'tobi__slider'
      lightbox.appendChild(slider)

      // Create previous button
      prevButton = document.createElement('button')
      prevButton.className = 'tobi__prev'
      prevButton.setAttribute('type', 'button')
      prevButton.setAttribute('aria-label', config.navLabel[0])
      prevButton.innerHTML = config.navText[0]
      lightbox.appendChild(prevButton)

      // Create next button
      nextButton = document.createElement('button')
      nextButton.className = 'tobi__next'
      nextButton.setAttribute('type', 'button')
      nextButton.setAttribute('aria-label', config.navLabel[1])
      nextButton.innerHTML = config.navText[1]
      lightbox.appendChild(nextButton)

      // Create close button
      closeButton = document.createElement('button')
      closeButton.className = 'tobi__close'
      closeButton.setAttribute('type', 'button')
      closeButton.setAttribute('aria-label', config.closeLabel)
      closeButton.innerHTML = config.closeText
      lightbox.appendChild(closeButton)

      // Create counter
      counter = document.createElement('div')
      counter.className = 'tobi__counter'
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
      // Detect type
      for (var index in supportedElements) {
        if (supportedElements.hasOwnProperty(index)) {
          if (supportedElements[index].checkSupport(element)) {
            // Create slide elements
            var sliderElement = document.createElement('div'),
              sliderElementContent = document.createElement('div')

            sliderElement.className = 'tobi__slider__slide'
            sliderElement.style.position = 'absolute'
            sliderElement.style.left = x * 100 + '%'
            sliderElementContent.className = 'tobi__slider__slide__content'

            if (config.draggable) {
              sliderElementContent.classList.add('draggable')
            }

            // Create type elements
            supportedElements[index].init(element, sliderElementContent)

            // Add slide content container to slider element
            sliderElement.appendChild(sliderElementContent)

            // Add slider element to slider
            slider.appendChild(sliderElement)
            sliderElements.push(sliderElement)

            ++x

            break
          }
        }
      }
    }

    /**
     * Open the lightbox
     *
     * @param {number} index - Index to load
     * @param {function} callback - Optional callback to call after open
     */
    var open = function open (index, callback) {
      if (!isOpen() && !index) {
        index = 0
      }

      if (isOpen()) {
        if (!index) {
          throw new Error('Ups, Tobi is aleady open.')
        }

        if (index === currentIndex) {
          throw new Error('Ups, slide ' + index + ' is already selected.')
        }
      }

      if (index === -1 || index >= elementsLength) {
        throw new Error('Ups, I can\'t find slide ' + index + '.')
      }

      if (!config.scroll) {
        document.documentElement.classList.add('tobi-is-open')
        document.body.classList.add('tobi-is-open')
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

      // Makes lightbox appear, too
      lightbox.setAttribute('aria-hidden', 'false')

      // Update lightbox
      updateLightbox()

      // Preload late
      preload(currentIndex + 1)
      preload(currentIndex - 1)

      if (callback) {
        callback.call(this)
      }
    }

    /**
     * Close the lightbox
     *
     * @param {function} callback - Optional callback to call after close
     */
    var close = function close (callback) {
      if (!isOpen()) {
        throw new Error('Tobi is already closed.')
      }

      if (!config.scroll) {
        document.documentElement.classList.remove('tobi-is-open')
        document.body.classList.remove('tobi-is-open')
      }

      // Unbind events
      unbindEvents()

      // Reenable the user’s focus
      lastFocus.focus()

      // Don't forget to cleanup our current element
      var container = sliderElements[currentIndex].querySelector('.tobi__slider__slide__content')
      var type = container.getAttribute('data-type')
      supportedElements[type].onLeave(container)
      supportedElements[type].onCleanup(container)

      lightbox.setAttribute('aria-hidden', 'true')

      // Reset current index
      currentIndex = 0

      if (callback) {
        callback.call(this)
      }
    }

    /**
     * Preload slide
     *
     * @param {number} index - Index to preload
     */
    var preload = function preload (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      var type = container.getAttribute('data-type')

      supportedElements[type].onPreload(container)
    }

    /**
     * Load slide
     * Will be called when opening the lightbox or moving index
     *
     * @param {number} index - Index to load
     */
    var load = function load (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      var type = container.getAttribute('data-type')

      supportedElements[type].onLoad(container)
    }

    /**
     * Navigate to the previous slide
     *
     * @param {function} callback - Optional callback function
     */
    var prev = function prev (callback) {
      if (currentIndex > 0) {
        leave(currentIndex)
        load(--currentIndex)
        updateLightbox('left')
        cleanup(currentIndex + 1)
        preload(currentIndex - 1)

        if (callback) {
          callback.call(this)
        }
      }
    }

    /**
     * Navigate to the next slide
     *
     * @param {function} callback - Optional callback function
     */
    var next = function next (callback) {
      if (currentIndex < elementsLength - 1) {
        leave(currentIndex)
        load(++currentIndex)
        updateLightbox('right')
        cleanup(currentIndex - 1)
        preload(currentIndex + 1)

        if (callback) {
          callback.call(this)
        }
      }
    }

    /**
     * Leave slide
     * Will be called before moving index
     *
     * @param {number} index - Index to leave
     */
    var leave = function leave (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      var type = container.getAttribute('data-type')

      supportedElements[type].onLeave(container)
    }

    /**
     * Cleanup slide
     * Will be called after moving index
     *
     * @param {number} index - Index to cleanup
     */
    var cleanup = function cleanup (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      var container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      var type = container.getAttribute('data-type')

      supportedElements[type].onCleanup(container)
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
     * @param {string} dir - Current slide direction
     */
    var updateFocus = function updateFocus (dir) {
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

        if (!dir && !nextButton.disabled) {
          nextButton.focus()
        } else if (!dir && nextButton.disabled && !prevButton.disabled) {
          prevButton.focus()
        } else if (!nextButton.disabled && dir === 'right') {
          nextButton.focus()
        } else if (nextButton.disabled && dir === 'right' && !prevButton.disabled) {
          prevButton.focus()
        } else if (!prevButton.disabled && dir === 'left') {
          prevButton.focus()
        } else if (prevButton.disabled && dir === 'left' && !nextButton.disabled) {
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
     * Clear drag after touchend and mousup event
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
     * Recalculate drag / swipe event
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
        close()
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
      } else if (event.target === closeButton || event.target.className === 'tobi__slider__slide') {
        close()
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
        close()
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
      // Prevent dragging / swiping on textareas inputs, selects and videos
      var ignoreElements = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT', 'VIDEO'].indexOf(event.target.nodeName) !== -1

      if (ignoreElements) {
        return
      }

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
      event.stopPropagation()

      if (pointerDown) {
        event.preventDefault()

        drag.endX = event.touches[0].pageX
        drag.endY = event.touches[0].pageY

        if (Math.abs(drag.startX - drag.endX) > 0 && !swipingY && config.swipeClose) {
          // Horizontal swipe
          slider.style[transformProperty] = 'translate3d(' + (offsetTmp - Math.round(drag.startX - drag.endX)) + 'px, 0, 0)'

          swipingX = true
          swipingY = false
        } else if (Math.abs(drag.startY - drag.endY) > 0 && !swipingX) {
          // Vertical swipe
          slider.style[transformProperty] = 'translate3d(' + (offsetTmp + 'px, -' + Math.round(drag.startY - drag.endY)) + 'px, 0)'

          swipingX = false
          swipingY = true
        }
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
        swipingX = false
        swipingY = false

        updateAfterDrag()
      }

      clearDrag()
    }

    /**
     * Mousedown event handler
     *
     */
    var mousedownHandler = function mousedownHandler (event) {
      // Prevent dragging / swiping on textareas inputs, selects and videos
      var ignoreElements = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT', 'VIDEO'].indexOf(event.target.nodeName) !== -1

      if (ignoreElements) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      pointerDown = true
      drag.startX = event.pageX
      drag.startY = event.pageY
    }

    /**
     * Mousemove event handler
     *
     */
    var mousemoveHandler = function mousemoveHandler (event) {
      event.preventDefault()

      if (pointerDown) {
        drag.endX = event.pageX
        drag.endY = event.pageY

        if (Math.abs(drag.startX - drag.endX) > 0 && !draggingY && config.swipeClose) {
          // Horizontal drag
          slider.style[transformProperty] = 'translate3d(' + (offsetTmp - Math.round(drag.startX - drag.endX)) + 'px, 0, 0)'

          draggingX = true
          draggingY = false
        } else if (Math.abs(drag.startY - drag.endY) > 0 && !draggingX) {
          // Vertical drag
          slider.style[transformProperty] = 'translate3d(' + (offsetTmp + 'px, -' + Math.round(drag.startY - drag.endY)) + 'px, 0)'

          draggingX = false
          draggingY = true
        }
      }
    }

    /**
     * Mouseup event handler
     *
     */
    var mouseupHandler = function mouseupHandler (event) {
      event.stopPropagation()

      pointerDown = false

      if (drag.endX) {
        draggingX = false
        draggingY = false

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
     * Checks whether element has requested data-type value
     *
     */
    var checkType = function checkType (element, type) {
      return element.getAttribute('data-type') === type
    }

    /**
     * Remove all `src` attributes
     *
     * @param {HTMLElement} element - Element to remove all `src` attributes
     */
    var removeSources = function setVideoSources (element) {
      var sources = element.querySelectorAll('src')

      if (sources) {
        Array.prototype.forEach.call(sources, function (source) {
          source.setAttribute('src', '')
        })
      }
    }

    /**
     * Update lightbox
     *
     * @param {string} dir - Current slide direction
     */
    var updateLightbox = function updateLightbox (dir) {
      updateOffset()
      updateCounter()
      updateFocus(dir)
    }

    /**
     * Reset the lightbox
     *
     * @param {function} callback - Optional callback to call after reset
     */
    var reset = function reset (callback) {
      if (slider) {
        while (slider.firstChild) {
          slider.removeChild(slider.firstChild)
        }
      }

      gallery.length = sliderElements.length = elementsLength = figcaptionId = x = 0

      if (callback) {
        callback.call(this)
      }
    }

    /**
     * Check if the lightbox is open
     *
     */
    var isOpen = function isOpen () {
      return lightbox.getAttribute('aria-hidden') === 'false'
    }

    /**
     * Return current index
     *
     */
    var currentSlide = function currentSlide () {
      return currentIndex
    }

    init(userOptions)

    return {
      open: open,
      prev: prev,
      next: next,
      close: close,
      add: add,
      reset: reset,
      isOpen: isOpen,
      currentSlide: currentSlide
    }
  }

  return Tobi
}))
