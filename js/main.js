(function($) {
  
  var DIRECTION = { // Direction constants for sliding crosswords in and out
    LEFT: -1,
    NONE:  0,
    RIGHT: 1
  };
  
  var SLIDE_DURATION = 350; // Duration of slide animation
  
  
  // Wrapper for UI representation of a crossword
  function Crossword4UI(crossword) {
    this.crossword = crossword;
    this.$crossword = null;
    this.rotationState = null;
  }
  
  Crossword4UI.prototype = {
    // Returns (possibly also creates) the crossword's DOM element
    getDOMElement: function() {
      if (this.$crossword === null) {
        this.$crossword = this.crossword.createDOMElement();
        this.rotationState = new RotationState();
      }
      
      return this.$crossword;
    },
    
    // Deletes the crossword's DOM element
    deleteDOMElement: function() {
      if (this.$crossword === null) {
        return;
      }
      
      this.$crossword.remove();
      
      this.$crossword = null;
      this.rotationState = null;
    }
  };
  
  
  var crosswords4UI = [];
  var currentCrosswordIndex = -1;
  var generatedAllAlternatives = false;


  $(document).ready(function() {
    // Enable input data sorting
    $('ul.inputData').sortable({
      handle: '.dragHandle',
      stop: function(event, ui) {
        $('button[name=generate]').click();
      }
    });
    
    // Connect to window resizing handler
    $(window).resize(windowResizeHandler);
    
    // Connect click handlers
    $('ul.tabTitle li').click(tabClickHandler);
    $('button[name=add]').click(addWordClickHandler);
    $('button[name=remove]').click(removeWordClickHandler);
    $('button[name=clear]').click(clearClickHandler);
    $('button[name=generate]').click(generateClickHandler);
    $('button[name=previous]').click(previousClickHandler);
    $('button[name=next]').click(nextClickHandler);
    $('button[name=rotate]').click(rotateClickHandler);
    $('button[name=printTeacher]').click(print4TeacherClickHandler);
    $('button[name=printStudent]').click(print4StudentClickHandler);
    
    // Connect input data change handler
    $('ul.inputData input[name=word]').change(wordChangedHandler);
    
    $('button[name=generate]').click(); // Trigger crossword generation
  });
  
  
  // Returns left margin for centering an absolutely positioned child within its parent
  function getLeftMarginForCentering($parent, $child) {
    return ($parent.width() - $child.width()) / 2.0;
  }
  
  
  // Returns left margin of centered child shifted by its width (times a factor)
  function getShiftedLeftMargin($parent, $child, direction) {
    var FACTOR = 1.2;
    
    var margin = getLeftMarginForCentering($parent, $child);
    
    switch (direction) {
      case DIRECTION.RIGHT:
        return margin + $child.width() * FACTOR;
        
      case DIRECTION.LEFT:
        return margin - $child.width() * FACTOR;
    }
    
    return margin;
  }
  
  
  // Handler for window resizing events
  function windowResizeHandler(event) {
    var $parent = $('#crosswordWrapper');
    var $child  = $('#crosswordWrapper table.crossword');
    
    $child.css({ marginLeft: getLeftMarginForCentering($parent, $child) + 'px' });
  }
  
  
  // Handler for tab clicks
  function tabClickHandler(event) {
    if ($(this).hasClass('active')) {
      return;
    }
    
    $('ul.tabTitle li.active').removeClass('active');
    $(this).addClass('active');
    
    $('div.tabBody div').hide();
    var index = $('ul.tabTitle li').index($(this));
    $($('div.tabBody div').get(index)).show();
  }
  
  
  // Handler for "Add Word" button clicks
  function addWordClickHandler(event) {
    if ($('ul.inputData li').length === 1) {
      $('button[name=remove]').removeAttr('disabled');
    }
    
    var $li = $('ul.inputData li:last-child').clone();
    $li.find('input, textarea').val('');
    $li.find('button[name=remove]').click(removeWordClickHandler);
    $('ul.inputData').append($li);
  }
  
  
  // Handler for "Remove Word" button clicks
  function removeWordClickHandler(event) {
    var $parent = $(this).parent();
    
    while (! $parent.parent().hasClass('inputData')) {
      $parent = $parent.parent();
    }
    
    $parent.remove();
    
    if ($('ul.inputData li').length === 1) {
      $('button[name=remove]').attr('disabled', 'disabled');
    }
  }
  
  
  // Handler for "Clear" button clicks
  function clearClickHandler(event) {
    clear();
    
    // Clear input data
    $('ul.inputData input[name=word]').val('');
    $('ul.inputData textarea[name=clue]').empty();
    
    // Disable buttons
    disableButton('previous');
    disableButton('next');
    disableButton('rotate');
    disableButton('printTeacher');
    disableButton('printStudent');
  }
  
  
  // Clears all input data and any generated crosswords
  function clear() {
    $('#outdatedMessage').slideUp();
    $('#errorMessage').slideUp();
    
    $('#crosswordWrapper').empty();
    
    crosswords4UI = [];
    currentCrosswordIndex = -1;
    generatedAllAlternatives = false;
  }
  
  
  // Disables the button with the specified name
  function disableButton(name) {
    $('button[name=' + name + ']').attr('disabled', 'disabled');
  }
  
  
  // Enables the button with the specified name
  function enableButton(name) {
    $('button[name=' + name + ']').removeAttr('disabled');
  }
  
  
  // Generates and stores the next crossword
  function generateNextCrossword() {
    var crossword = $.crossword('generate');
    
    if (crossword === null) {
      generatedAllAlternatives = true;
    } else {
      crosswords4UI.push(new Crossword4UI(crossword));
    }
    
    return !generatedAllAlternatives;
  }
  
  
  // Handler for "Generate" clicks
  function generateClickHandler(event) {
    clear(); // Clear any previous crosswords
    
    // Disable printing options
    $('button[name=printTeacher]').attr('disabled', 'disabled');
    $('button[name=printStudent]').attr('disabled', 'disabled');
    
    // Read input data
    var words = [];
    var clues = [];
    $('ul.inputData li').each(function(index, element) {
      var word = $.trim($(element).find('input[name=word]').val());
      var clue = $.trim($(element).find('textarea[name=clue]').val());

      if (word.length && clue.length) {
        words.push(word);
        clues.push(clue);
      }
    });
    
    // Check for empty input data
    if (! words.length || ! clues.length) {
      console.log('no input data');
      return;
    }
    
    $.crossword('init', { words: words, clues: clues });
    
    if (generateNextCrossword()) { // Generate first alternative
      // Select and display first alternative
      currentCrosswordIndex = 0;
      slideIn(crosswords4UI[currentCrosswordIndex], DIRECTION.NONE);
      
      // (Re)activate buttons
      enableButton('rotate');
      enableButton('printTeacher');
      enableButton('printStudent');
      
      if (generateNextCrossword()) { // Generate second alternative
        enableButton('next');
      }
    } else {
      $('#errorMessage').slideDown();
    }
  }
  
  
  // Handler for "Previous" clicks
  function previousClickHandler(event) {
    if (currentCrosswordIndex <= 0) {
      return;
    }
    
    slideOut(crosswords4UI[currentCrosswordIndex], DIRECTION.RIGHT);
    slideIn(crosswords4UI[--currentCrosswordIndex], DIRECTION.LEFT);
    
    if (currentCrosswordIndex === 0) { // Reached first crossword
      disableButton('previous');
    }
    
    if (currentCrosswordIndex === crosswords4UI.length - 2) { // Started from last crossword
      enableButton('next');
    }
  }
  
  
  // Handler for "Next" clicks
  function nextClickHandler(event) {
    if (currentCrosswordIndex >= crosswords4UI.length - 1) {
      return;
    }
    
    if (currentCrosswordIndex === crosswords4UI.length - 2 && !generatedAllAlternatives) {
      generateNextCrossword();
    }
    
    slideOut(crosswords4UI[currentCrosswordIndex], DIRECTION.LEFT);
    slideIn(crosswords4UI[++currentCrosswordIndex], DIRECTION.RIGHT);
    
    if (currentCrosswordIndex === crosswords4UI.length - 1) { // Reached last crossword
      disableButton('next');
    }
    
    if (currentCrosswordIndex === 1) { // Started from first crossword
      enableButton('previous');
    }
  }
  
  
  // Slides a crossword in from the specified direction
  function slideIn(crossword4UI, from) {
    var $parent    = $('#crosswordWrapper');
    var $crossword = crossword4UI.getDOMElement();
    
    var needsInitialMargin = true;
    
    if ($crossword.is(':animated')) { // Cancel previous slide animation
      $parent.stop();
      $crossword.stop();
      needsInitialMargin = false;
    } else { // Hide and append new crossword
      $('#crosswordWrapper').append($crossword.css({ opacity: 0 }));
    }
    
    setTimeout(function() { // Work around rendering race condition
      var marginStop  = getLeftMarginForCentering($parent, $crossword);
      
      if (needsInitialMargin) { // Initially shift crossword
        var marginStart = getShiftedLeftMargin($parent, $crossword, from)
        $crossword.css({ marginLeft: marginStart + 'px' });
      }
      
      animateSlide($crossword, marginStop, 1);
      
      // Resize container
      if (from !== DIRECTION.NONE) {
        $parent.animate({ height: $crossword.height() + 'px' }, SLIDE_DURATION);
      } else {
        $parent.css({ height: $crossword.height() + 'px' });
      }
    }, 0);
  }
  
  
  // Slides a crossword out to the specified direction
  function slideOut(crossword4UI, to) {
    var $parent    = $('#crosswordWrapper');
    var $crossword = crossword4UI.getDOMElement();
    var marginStop = getShiftedLeftMargin($parent, $crossword, to);
    
    $crossword.stop(); // Cancel any previous slide animation
    
    animateSlide($crossword, marginStop, 0, function() {
      crossword4UI.deleteDOMElement();
    });
  }
  
  
  // Animates the slide of a crossword
  function animateSlide($crossword, marginLeft, opacity, callback) {
    $crossword.animate({ // Hide old crossword
      opacity:    opacity,
      marginLeft: marginLeft + 'px'
    }, SLIDE_DURATION, callback);
  }

  
  // Handler for "Rotate" button clicks
  function rotateClickHandler(event) {
    var state = crosswords4UI[currentCrosswordIndex].rotationState;
    
    if (state.rotating) {
      ++state.queuedRotations;
      return;
    }
    
    state.rotating = true;
    
    rotate(state, crosswords4UI[currentCrosswordIndex]);
  }
  
  
  // State for rotating a crossword
  function RotationState() {
    this.rotating = false;
    
    this.queuedRotations = 0;
    
    this.degreeOuter = 0;
    this.degreeOuterStop = 0;
    this.degreeOuterStep = 0;
    
    this.xScaleOuter = 1;
    this.xScaleOuterStop = 1;
    this.xScaleOuterStep = 0;
    
    this.yScaleOuter = 1;
    this.yScaleOuterStop = 1;
    this.yScaleOuterStep = 0;
    
    this.degreeInner = 0;
    this.degreeInnerStop = 0;
    this.degreeInnerStep = 0;
    
    this.xScaleInner = 1;
    this.xScaleInnerStop = 1;
    this.xScaleInnerStep = 0;
    
    this.timer = null;
  }
  
  
  // Rotates a crossword
  function rotate(state, crossword4UI) {
    var NUM_STEPS = 25;
    var STEP_SEPARATION = 15;
    var TOLERANCE = 1E-7;
    
    var $crossword = crossword4UI.getDOMElement();
    var $lettersAndClues = $crossword.find('tr td.letter div, tr td.clue div');
    
    // Rotate outer element by 90 degrees
    state.degreeOuterStop += 90;
    state.degreeOuterStep = (state.degreeOuterStop - state.degreeOuter) / NUM_STEPS;
    
    // Invert outer element
    if (state.xScaleOuter === state.yScaleOuter) { // Invert y axis
      state.xScaleOuterStop = state.xScaleOuter;
      state.yScaleOuterStop = -state.yScaleOuter;
    } else { // Invert x axis
      state.xScaleOuterStop = -state.xScaleOuter;
      state.yScaleOuterStop = state.yScaleOuter;
    }
    
    state.xScaleOuterStep = (state.xScaleOuterStop - state.xScaleOuter) / NUM_STEPS;
    state.yScaleOuterStep = (state.yScaleOuterStop - state.yScaleOuter) / NUM_STEPS;
    
    // Rotate inner elements back and forth between 0 and 90 degrees
    state.degreeInnerStop = (state.degreeInner === 0) ? -90 : 0;
    state.degreeInnerStep = (state.degreeInnerStop - state.degreeInner) / NUM_STEPS;
    
    // Invert inner elements (invert x axis)
    state.xScaleInnerStop = -state.xScaleInner;
    state.xScaleInnerStep = (state.xScaleInnerStop - state.xScaleInner) / NUM_STEPS;
    
    performRotationStep(); // Start rotation
    
    function performRotationStep() {
      state.degreeOuter = Math.min(state.degreeOuter, state.degreeOuterStop);
      state.degreeInner = (state.degreeInnerStop === 0) ? Math.min(state.degreeInner, state.degreeInnerStop)
                                                        : Math.max(state.degreeInner, state.degreeInnerStop);
      
      applyTransformation($crossword, state.degreeOuter, state.xScaleOuter, state.yScaleOuter);
      applyTransformation($lettersAndClues, state.degreeInner, state.xScaleInner, 1);
      
      if (Math.abs(state.degreeOuter - state.degreeOuterStop) > TOLERANCE) {
        state.timer = setTimeout(function() {
          state.degreeOuter += state.degreeOuterStep;
          state.degreeInner += state.degreeInnerStep;
          performRotationStep();
        }, STEP_SEPARATION);
      } else {
        clearTimeout(state.timer);
        
        // Account for rounding errors
        state.degreeOuter = Math.round(state.degreeOuter);
        state.degreeInner = Math.round(state.degreeInner);
        
        // Project outer angle back
        state.degreeOuter %= 360;
        state.degreeOuterStop %= 360;
        
        performInversionStep(); // Start inversion
      }
    }
    
    function performInversionStep() {
      state.xScaleOuter = (state.xScaleOuterStop < 0) ? Math.max(state.xScaleOuter, state.xScaleOuterStop)
                                                      : Math.min(state.xScaleOuter, state.xScaleOuterStop);
      state.yScaleOuter = (state.yScaleOuterStop < 0) ? Math.max(state.yScaleOuter, state.yScaleOuterStop)
                                                      : Math.min(state.yScaleOuter, state.yScaleOuterStop);
      state.xScaleInner = (state.xScaleInnerStop < 0) ? Math.max(state.xScaleInner, state.xScaleInnerStop)
                                                      : Math.min(state.xScaleInner, state.xScaleInnerStop);
      
      applyTransformation($crossword, state.degreeOuter, state.xScaleOuter, state.yScaleOuter);
      applyTransformation($lettersAndClues, state.degreeInner, state.xScaleInner, 1);
      
      if (Math.abs(state.xScaleOuter - state.xScaleOuterStop) > TOLERANCE ||
          Math.abs(state.yScaleOuter - state.yScaleOuterStop) > TOLERANCE) {
        state.timer = setTimeout(function() {
          state.xScaleOuter += state.xScaleOuterStep;
          state.yScaleOuter += state.yScaleOuterStep;
          state.xScaleInner += state.xScaleInnerStep;
          performInversionStep();
        }, STEP_SEPARATION);
      } else {
        // Account for rounding errors
        state.xScaleOuter = Math.round(state.xScaleOuter);
        state.yScaleOuter = Math.round(state.yScaleOuter);
        state.xScaleInner = Math.round(state.xScaleInner);
        
        clearTimeout(state.timer);
        
        if (state.queuedRotations > 0) {
          --state.queuedRotations;
          rotate(state, $crossword, $lettersAndClues);
        } else {
          state.rotating = false;
        }
      }
    }
    
    function applyTransformation($element, degree, xScale, yScale) {
      $element.css({ transform: 'rotate(' + degree + 'deg) ' +
                                'scaleX(' + xScale + ')' +
                                'scaleY(' + yScale + ')' });
    }
  }
  
  
  // Handler for "Print Teacher Variant" button clicks
  function print4TeacherClickHandler(event) {
    print(false);
  }
  
  
  // Handler for "Print Student Variant" button clicks
  function print4StudentClickHandler(event) {
    print(true);
  }
  
  
  // Prints the currently displayed crossword
  function print(forStudent) {
    if (currentCrosswordIndex < 0 || currentCrosswordIndex > crosswords4UI.length - 1) {
      return;
    }
    
    var crossword4UI = crosswords4UI[currentCrosswordIndex];
    var $crossword   = crossword4UI.getDOMElement();
    var $letters     = null;
    
    var marginLeft = $crossword.css('margin-left');
    
    $crossword.css({ marginLeft: 0 }); // Clear margin
    
    if (forStudent) { // Hide crossword letters
      $letters = $crossword.find('tr td.letter div');
      $letters.hide();
    }
    
    renderClues(crossword4UI);
    window.print();
    
    if (forStudent) { // Show crossword letters
      $letters.show();
    }
    
    $crossword.css({ marginLeft: marginLeft }); // Restore margin
  }
  
  
  // Renders clues for a crossword
  function renderClues(crossword4UI) {
    var clues = [];
    
    for (var i = 0; i < crossword4UI.crossword.length; ++i) {
      var word = crossword4UI.crossword.get(i);
      clues[word.number - 1] = word.clue;
    }
    
    var $ul = $('<ul>').addClass('clues');
    
    for (var i = 0; i < clues.length; ++i) {
      var $li = $('<li>').html(clues[i]);
      $ul.append($li);
    }
    
    $('section.clues').html($ul);
  }
  
  
  // Handler for input data change events
  function wordChangedHandler(event) {
    $('#outdatedMessage').slideDown();
  }
  
})(jQuery);
