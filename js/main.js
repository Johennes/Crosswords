var major_version_number = 0;
var minor_version_number = 1;
var word_matrix = null;
var clue_array = null;

$(document).ready(function() {
    // Insert version numbers
    $('.major_version_number').html(major_version_number);
    $('.minor_version_number').html(minor_version_number);

    // Enable discolsures
    $('div.collapser h3').addClass('inactive');
    $('div.collapser div').hide();
    $('div.collapser h3').click(function() {
      $h3 = $(this);
      $cont = $(this).next();
      
      if ($h3.hasClass('active')) {
        $h3.removeClass('active');
        $h3.addClass('inactive');
        $cont.hide();
      } else {
        $h3.removeClass('inactive');
        $h3.addClass('active');
        $cont.show();
      }
    });
    //$('div.collapser').collapse(
    /*{
        show: function() {
            this.animate({
                opacity: 'toggle',
                height: 'toggle'
            }, 300);
        }
    }*/
    //);
    
    $('div.collapser h3').addClass('inactive');

    // Handle error dialog dismissing
    $('#error_dialog_ok').click(function() {
        $.unblockUI();
        return false;
    });

    // Connect add word button
    $('#add_word_button').click(function() {
        // Append input fields
        $('#input_data_body').append('\
            <tr>\
                <td><textarea rows="1" cols="25" class="input_word"></textarea></td>\
                <td><textarea rows="3" cols="25" class="input_clue"></textarea></td>\
                <td>\
                    <div class="input_item_button_box">\
                        <img src="img/up.png" alt="" class="button input_move_up_button"/>\
                        <img src="img/down.png" alt="" class="button input_move_down_button"/>\
                        <img src="img/delete.png" alt="" class="button input_delete_button"/>\
                    </div>\
                </td>\
            </tr>\
        ');

        // Expand input data
        if ($('#input_data_collapser').hasClass('inactive')) {
            $('thead#input_data_head').show();
            $('#input_data_collapser').click();
        }

        // Connect move up button
        $('.input_move_up_button:last').click(function() {
            var parent = $(this).parent().parent().parent();
            var prev = $(parent).prev();
            if (prev) $(prev).before(parent);
        });

        // Connect move down button
        $('.input_move_down_button:last').click(function() {
            var parent = $(this).parent().parent().parent();
            var next = $(parent).next();
            if (next) $(next).after(parent);
        });

        // Connect delete button
        $('.input_delete_button:last').click(function() {
            var parent = $(this).parent().parent().parent();
            var prev = $(parent).prev();
            var next = $(parent).next();

            $(parent).remove();

            if (! prev.length && ! next.length) {
                $('#input_data_collapser').click();
                $('thead#input_data_head').hide();
            }
        });

        $('#input_data_container').show();
    });

    // Connect clear button
    $('#clear_button').click(function() {
        if ($('#input_data_collapser').hasClass('active')) {
            $('#input_data_collapser').click();
        }
        $('thead#input_data_head').hide();
        $('tbody#input_data_body').empty();

        if ($('#puzzle_collapser').hasClass('active')) $('#puzzle_collapser').click();
        $('#puzzle').empty();

        if ($('#clue_collapser').hasClass('active')) $('#clue_collapser').click();
        $('#clues').empty();

        if ($('#printing_collapser').hasClass('active')) $('#printing_collapser').click();
        $('div#printing_container table').hide();
    });

    // Connect generate button
    $('#generate_button').click(function() {
        // Clear puzzle & clues
        if ($('#puzzle_collapser').hasClass('active')) $('#puzzle_collapser').click();
        $('#puzzle').empty();
        if ($('#clue_collapser').hasClass('active')) $('#clue_collapser').click();
        $('#clues').empty();

        // Hide printin options
        if ($('#printing_collapser').hasClass('active')) $('#printing_collapser').click();
        $('div#printing_container table').hide();
        
        // Read input data
        var items = $('#input_data_body').children();
        var words = new Array();
        var clues = new Array();
        for (var i = 0; i < items.length; ++i) {
            var word = trim($(items[i]).children().children('textarea.input_word').val());
            var clue = trim($(items[i]).children().children('textarea.input_clue').val());

            if (/\d/.test(word)) {
                var msg = 'Words are not allowed to contain numbers. The puzzle generation algorithm uses numbers'
                    + ' internally to refer to clue marker fields.';
                error_dialog(msg);
                return;
            }

            if (/@/.test(word)) {
                var msg = 'Words are not allowed to contain <i>@</i> signs. The <i>@</i> sign is used internally'
                    + ' by the puzzle generation algorithm.';
                error_dialog(msg);
                return;
            }

            if (word.length && clue.length) {
                words[i] = '@' + word; // Prepend @ as placeholder for clue number
                clues[i] = clue;
            } else {
                var msg = 'Blank input fields are not allowed. Please fill out all the fields in the <i>Input Data</i> section'
                    + ' or remove any unneeded blank fields.';
                error_dialog(msg);
                return;
            }
        }

        // Check for empty input data
        if (! words.length || ! clues.length) {
            var msg = 'No input data. Please specify a list of words and clues.'
                + ' To add a new word clue pair, hit the <img src="img/add.png" alt="" class="small_button"/> button';
            error_dialog(msg);
            return;
        }

        var puzzle_words = fit(words, clues); // Generate puzzle

        if (! puzzle_words) {
            var msg = 'Crossword generation failed. The set of words you specified does not allow for a proper'
                + ' connection and should be modified. If this happens to you very often it might be a good idea'
                + ' to start with a small number of words and gradually add more words as you see where they could fit'
                + ' into the puzzle.';
            error_dialog(msg, 350);
            return;
        }

        // Generate word matrix & clue array
        var rv = puzzle_words_to_arrays(puzzle_words);
        word_matrix = rv[0];
        clue_array = rv[1];
        
        // Display puzzle & clues
        display_puzzle(puzzle_words);
        if ($('#puzzle_collapser').hasClass('inactive')) $('#puzzle_collapser').click();
        if ($('#clue_collapser').hasClass('inactive')) $('#clue_collapser').click();

        // Show printing options
        $('div#printing_container table').show();
        if ($('#printing_collapser').hasClass('inactive')) $('#printing_collapser').click();
    });

    // Connect print buttons
    $('img#print_teacher').click(function() {
        $('div#puzzle_print_container').html($('div#puzzle').html());
         $('div#clue_print_container').html($('div#clues').html());
    });
    $('img#print_student').click(function() {
        $('div#puzzle_print_container').html($('div#puzzle').html());
        $('div#clue_print_container').html($('div#clues').html());
        $('div#puzzle_print_container table tr td div.value_puzzle_field span').html('');
    });
    $('img#print_teacher, img#print_student').printPreview();
});

function PuzzleWord(word, clue, x1, y1, x2, y2) {
    this.word = word;
    this.clue = clue;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
}

function Clue(clue, x, y, direction) {
    this.x = x;
    this.y = y;
    this.clue = clue;
    this.direction = direction;
}

function fit(words, clues) {
    return do_fit(words, clues, []);
}

function do_fit(words, clues, puzzle_words) {
    if (! words.length) { // We're finished
        return puzzle_words;
    }

    // Try to match one of the remaining words
    for (var iw = 0; iw < words.length; ++iw) {
        var ix_max = max_x(puzzle_words) + ((! puzzle_words.length) ? 8 : 0);
        var iy_max = max_y(puzzle_words) + ((! puzzle_words.length) ? 8 : 0);
        
        for (var ix = 0; ix <= ix_max; ++ix) {
            for (var iy = 0; iy <= iy_max; ++iy) {
                for (var d = 0; d <= 1; ++d) {
                    // Try to match current word
                    var puzzle_word = null;
                    var ix2;
                    var iy2;

                    if (! d) { // Horizontal direction
                        ix2 = ix + words[iw].length - 1;
                        iy2 = iy;
                    } else { // Vertical direction
                        ix2 = ix;
                        iy2 = iy + words[iw].length - 1;
                    }

                    if (fits(words[iw], ix, iy, ix2, iy2, puzzle_words)) {
                        puzzle_word = new PuzzleWord(words[iw], clues[iw], ix, iy, ix2, iy2);
                    }

                    if (puzzle_word) { // Fitting of current word succeeded
                        puzzle_words.push(puzzle_word); // Extend puzzle words array

                        // Shrink word & clue array. Note: The string cast is necessary since splice
                        // seems to return a general type object.
                        var word = String(words.splice(iw, 1));
                        var clue = String(clues.splice(iw, 1));

                        // Try to fit the remaining words
                        rv = do_fit(words, clues, puzzle_words);

                        if (rv) return puzzle_words; // Fitting of remaining words succeeded
                        else { // Fitting of remaining words failed => Undo changes
                            puzzle_words.pop();
                            words.splice(iw, 0, word);
                            clues.splice(iw, 0, clue);
                        }
                    }
                }
            }
        }
    }

    return null; // Fitting failed ultimately
}

function max_x(puzzle_words) {
    max = 0;
    for (var i = 0; i < puzzle_words.length; ++i) {
        if (puzzle_words[i].x2 > max) max = puzzle_words[i].x2;
    }
    return max;
}

function max_y(puzzle_words) {
    max = 0;
    for (var i = 0; i < puzzle_words.length; ++i) {
        if (puzzle_words[i].y2 > max) max = puzzle_words[i].y2;
    }
    return max;
}

function fits(word, x1, y1, x2, y2, puzzle_words) {
    if (! puzzle_words.length) return true;

    var intersected = false;
    
    for (var i = 0; i < puzzle_words.length; ++i) {
        // Both words in x-direction
        if (y1 == y2 && puzzle_words[i].y1 == puzzle_words[i].y2) {
            if (Math.abs(y1 - puzzle_words[i].y1) > 1) continue;
            if (x1 >= puzzle_words[i].x1 - 1 && x1 <= puzzle_words[i].x2 + 1) return false;
            if (puzzle_words[i].x1 >= x1 - 1 && puzzle_words[i].x1 <= x2 + 1) return false;
            if (x2 >= puzzle_words[i].x1 - 1 && x2 <= puzzle_words[i].x2 + 1) return false;
            if (puzzle_words[i].x2 >= x1 - 1 && puzzle_words[i].x2 <= x2 + 1) return false;
        }
        
        // Both words in y-direction
        if (x1 == x2 && puzzle_words[i].x1 == puzzle_words[i].x2) {
            if (Math.abs(x1 - puzzle_words[i].x1) > 1) continue;
            if (y1 >= puzzle_words[i].y1 - 1 && y1 <= puzzle_words[i].y2 + 1) return false;
            if (puzzle_words[i].y1 >= y1 - 1 && puzzle_words[i].y1 <= y2 + 1) return false;
            if (y2 >= puzzle_words[i].y1 - 1 && y2 <= puzzle_words[i].y2 + 1) return false;
            if (puzzle_words[i].y2 >= y1 - 1 && puzzle_words[i].y2 <= y2 + 1) return false;
        }
        
        // Perpendicular words
        if (x1 == x2) {
            if (y1 > puzzle_words[i].y1 + 1 || y2 < puzzle_words[i].y1 - 1) continue;
            if (x1 > puzzle_words[i].x2 + 1 || x1 < puzzle_words[i].x1 - 1) continue;

            if (y1 == puzzle_words[i].y1 + 1 && x1 >= puzzle_words[i].x1 - 1 && x1 <= puzzle_words[i].x2 + 1) return false;
            if (y2 == puzzle_words[i].y1 - 1 && x1 >= puzzle_words[i].x1 - 1 && x1 <= puzzle_words[i].x2 + 1) return false;
            if (x1 == puzzle_words[i].x1 - 1 && puzzle_words[i].y1 >= y1 - 1 && puzzle_words[i].y1 <= y2 + 1) return false;
            if (x1 == puzzle_words[i].x2 + 1 && puzzle_words[i].y1 >= y1 - 1 && puzzle_words[i].y1 <= y2 + 1) return false;
            
            if (word[puzzle_words[i].y1 - y1] == puzzle_words[i].word[x1 - puzzle_words[i].x1]
                && word[puzzle_words[i].y1 - y1] != '@') intersected = true;
            else return false;
        } else { // y1 == y2
            if (y1 > puzzle_words[i].y2 + 1 || y1 < puzzle_words[i].y1 - 1) continue;
            if (x1 > puzzle_words[i].x1 + 1 || x2 < puzzle_words[i].x1 - 1) continue;
            
            if (x1 == puzzle_words[i].x1 + 1 && y1 >= puzzle_words[i].y1 - 1 && y1 <= puzzle_words[i].y2 + 1) return false;
            if (x2 == puzzle_words[i].x1 - 1 && y1 >= puzzle_words[i].y1 - 1 && y1 <= puzzle_words[i].y2 + 1) return false;
            if (y1 == puzzle_words[i].y1 - 1 && puzzle_words[i].x1 >= x1 - 1 && puzzle_words[i].x1 <= x2 + 1) return false;
            if (y1 == puzzle_words[i].y2 + 1 && puzzle_words[i].x1 >= x1 - 1 && puzzle_words[i].x1 <= x2 + 1) return false;
            
            if (word[puzzle_words[i].x1 - x1] == puzzle_words[i].word[y1 - puzzle_words[i].y1]
                && word[puzzle_words[i].x1 - x1] != '@' && word[puzzle_words[i].x1 - x1] != '-') intersected = true;
            else return false;
        }
    }

    if (intersected) return true;
    else return false;
}

function trim(s) {
    var l=0;
    var r=s.length -1;
    
    while (l < s.length && s[l] == ' ') l++;
    while(r > l && s[r] == ' ') r-=1;
    
    return s.substring(l, r+1);
}

function display_puzzle() {
    // Generate puzzle table
    var puzzle_table = '<table border="0" cellpadding="0" cellspacing="2px">\n';

    for (var iy = 0; iy < word_matrix.length; ++iy) {
        puzzle_table += '<tr>\n'

        for (var ix = 0; ix < word_matrix[iy].length; ++ix) {
            // Determine field class
            var classes = 'puzzle_field';
            var img = '';
            if (! word_matrix[iy][ix]) classes += ' empty_puzzle_field';
            else {
                classes += ' filled_puzzle_field';
                
                if (isNaN(parseInt(word_matrix[iy][ix]))) {
                    classes += ' value_puzzle_field border';
                    //img = '<img src="img/field.png" alt="" class="puzzle_field_background"/>';
                } else {
                    classes += ' clue_puzzle_field';
                    
                    if (! clue_array[parseInt(word_matrix[iy][ix]) - 1].direction){
                        classes += ' horizontal_clue_puzzle_field';
                        img = '<img src="img/horizontal-clue.png" alt="" class="puzzle_field_background"/>';
                    } else {
                        classes += ' vertical_clue_puzzle_field';
                        img = '<img src="img/vertical-clue.png" alt="" class="puzzle_field_background"/>';
                    }
                }
            }
            
            // Determine field value
            var value = ((word_matrix[iy][ix]) ? word_matrix[iy][ix] : '');

            // Add data cell
            puzzle_table += '<td><div class="' + classes + '">' + img + '<span>' + value + '</span></div></td>\n';
        }
        
        puzzle_table += '</tr>\n'
    }

    puzzle_table += '</table>';

    $('div#puzzle').html(puzzle_table); // Insert puzzle table

    // Generate clues table
    var clue_table = '<table border="0" cellpadding="0" cellspacing="2px">\n';

    for (var i = 0; i < clue_array.length; ++i) {
        var classes = 'puzzle_field filled_puzzle_field clue_puzzle_field';
        var img = '';
        if (! clue_array[i].direction) {
            classes += ' horizontal_clue_puzzle_field';
            img = '<img src="img/horizontal-clue.png" alt="" class="puzzle_field_background"/>';
        } else {
            classes += ' vertical_clue_puzzle_field';
            img = '<img src="img/vertical-clue.png" alt="" class="puzzle_field_background"/>';
        }
        
        clue_table += '<tr>\n';
        clue_table += '<td><div class="' + classes + '">' + img + '<span>'
            + (i + 1) + '</span></div></td>\n';
        clue_table += '<td>' + clue_array[i].clue + '</td>\n';
        clue_table += '</tr>\n';
    }

    clue_table += '</table>';

    $('div#clues').html(clue_table); // Insert clue table
}

function puzzle_words_to_arrays(puzzle_words) {
    // Prepare word array
    var words = new Array();
    var x_max = max_x(puzzle_words);
    var y_max = max_y(puzzle_words);

    for (var i = 0; i <= y_max; ++i) {
        words[i] = new Array();
        for (var j = 0; j <= x_max; ++j) {
            words[i][j] = null;
        }
    }
    
    var clues = new Array(); // Prepare clue array
    
    // Insert puzzle words into word array & initialize clue array
    for (var i = 0; i < puzzle_words.length; ++i) {
        // Extend clue array
        var direction = ((puzzle_words[i].y1 == puzzle_words[i].y2) ? 0 : 1);
        clues.push(new Clue(puzzle_words[i].clue, puzzle_words[i].x1, puzzle_words[i].y1, direction));
        
        // Step through current word
        var j = 0;
        while (j < puzzle_words[i].word.length) {
            var idx_x = puzzle_words[i].x1 + (puzzle_words[i].x2 - puzzle_words[i].x1) / (puzzle_words[i].word.length - 1) * j;
            var idx_y = puzzle_words[i].y1 + (puzzle_words[i].y2 - puzzle_words[i].y1) / (puzzle_words[i].word.length - 1) * j;
            
            words[idx_y][idx_x] = puzzle_words[i].word[j];

            ++j;
        }
    }
    
    // Sort clue array
    clues.sort(function(clue1, clue2) {
        if (clue1.y < clue2.y) return -1;
        if (clue1.y > clue2.y) return 1;
        if (clue1.x < clue2.x) return -1;
        if (clue1.x > clue2.x) return 1;
        return 0;
    });
    
    // Insert sorted clue numbers
    for (var i = 0; i < clues.length; ++i){
        words[clues[i].y][clues[i].x] = i + 1;
    }

    return [words, clues];
}

function dialog_content(icon, message) {
    content = '<table cellspacing=0" cellpadding="0" border="0"><tr>'
    content += '<td><img src="img/' + icon + '" alt=""/></td>'
    content += '<td><p>' + message + '</p></td>'
    content += '</tr></table>'
    return content;
}

function error_dialog(message) {
    $('#error_dialog_message').html(message);
    $.blockUI({
        message: $('#error_dialog'),
        css: {
            width: '100%',
            left: 0,
            margin: 0,
            padding: 0,
            border: 0,
            background: 'none'
        }
    });
}
