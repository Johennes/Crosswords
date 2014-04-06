(function($) {
  
  var crossword = null;
  var rotated = false;

  $(document).ready(function() {
    // Enable input data sorting
    $('ul.inputData').sortable({
      handle: '.dragHandle',
      stop: function(event, ui) {
        $('button[name=generate]').click();
      }
    });
    
    // Connect click handlers
    $('ul.tabTitle li').click(tabClickHandler);
    $('button[name=add]').click(addWordClickHandler);
    $('button[name=remove]').click(removeWordClickHandler);
    $('button[name=clear]').click(clearClickHandler);
    $('button[name=generate]').click(generateClickHandler);
    $('button[name=next]').click(nextClickHandler);
    $('button[name=rotate]').click(rotateClickHandler);
    $('button[name=printTeacher]').click(print4TeacherClickHandler);
    $('button[name=printStudent]').click(print4StudentClickHandler);
    
    $('button[name=generate]').click(); // Trigger puzzle generation
  });
  
  
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
  
  
  function addWordClickHandler(event) {
    if ($('ul.inputData li').length === 1) {
      $('button[name=remove]').removeAttr('disabled');
    }
    
    var $li = $('ul.inputData li:last-child').clone();
    $li.find('input, textarea').val('');
    $li.find('button[name=remove]').click(removeWordClickHandler);
    $('ul.inputData').append($li);
  }
  
  
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
  
  
  function clearClickHandler(event) {
    clearPuzzle();
    
    $('ul.inputData input[name=word]').val('');
    $('ul.inputData textarea[name=clue]').empty();
    
    $('button[name=next]').attr('disabled', 'disabled');
    $('button[name=rotate]').attr('disabled', 'disabled');
    $('button[name=printTeacher]').attr('disabled', 'disabled');
    $('button[name=printStudent]').attr('disabled', 'disabled');
  }
  
  
  function clearPuzzle() {
    $('#puzzleWrapper').empty();
    crossword = null;
    rotated = false;
  }
  
  
  function generateClickHandler(event) {
    clearPuzzle();
    
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
    
    // Generate crossword
    crossword = $.crossword('generate', { words: words, clues: clues });
    
    if (crossword === null) {
      console.log('generation failed');
      return;
    }
    
    // Render crossword
    var $crossword = $.crossword('render', { crossword: crossword, clueRenderer: clueRenderer });
    $('#puzzleWrapper').html($crossword);
    
    // (Re)activate buttons
    $('button[name=next]').removeAttr('disabled');
    $('button[name=rotate]').removeAttr('disabled');
    $('button[name=printTeacher]').removeAttr('disabled');
    $('button[name=printStudent]').removeAttr('disabled');
  }
  
  
  function nextClickHandler(event) {
    console.log('not implemented yet');
  }
  
  
  function rotateClickHandler(event) {
    rotated = !rotated;
    
    var $crossword = $.crossword('render', {
      crossword: crossword,
      clueRenderer: clueRenderer,
      rotate: rotated
    });
    
    $('#puzzleWrapper').html($crossword);
  }
  
  
  function print4TeacherClickHandler(event) {
    console.log('not implemented yet');
  }
  
  
  function print4StudentClickHandler(event) {
    console.log('not implemented yet');
  }
  
  
  function clueRenderer($canvas, number) {
    var ctx = $canvas[0].getContext('2d');
    var width = $canvas[0].width;
    var height = $canvas[0].height;
    
    ctx.moveTo(0,0);
    
    if ($canvas.hasClass('horizontal')) {
      ctx.lineTo(0, height);
      ctx.lineTo(width, height / 2);
    } else if ($canvas.hasClass('vertical')) {
      ctx.lineTo(width,0);
      ctx.lineTo(width / 2, height);
    }
    
    ctx.lineTo(0,0);
    
    ctx.fillStyle = '#000';
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = '50px Roboto, sans-serif';
    
    if ($canvas.hasClass('horizontal')) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, 0, height / 2);
    } else if ($canvas.hasClass('vertical')) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(number, width / 2, 0);
    }
  }
  
})(jQuery);
