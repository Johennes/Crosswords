(function($) {
  
  // Word orientation constants
  var ORIENTATION = {
    HORIZONTAL: -1,
    NONE: 0,
    VERTICAL: 1
  };
  
  
  // Word and its associated clue
  function Word(number, value, clue) {
    this.number = number;
    this.value = value;
    this.length = value.length;
    this.clue = clue;
    
    this.start = new Coordinate(null, null);
    this.orientation = ORIENTATION.NONE;
  }
  
  Word.prototype = {
    // Returns character at index
    charAt: function(index) {
      return this.value[index];
    }
  };
  
  
  // Map that takes word objects as keys
  function WordMap() {
    this.map = {};
    this.length = 0;
  }
  
  WordMap.prototype = {
    // Translates word object to key
    getKey: function(word) {
      return word.number;
    },
    
    // Sets value for word object
    put: function(word, value) {
      this.map[this.getKey(word)] = value;
      ++this.length;
    },
    
    // Returns value for word object
    get: function(word) {
      return this.map[this.getKey(word)];
    },
    
    // Removes word object from map
    remove: function(word) {
      delete this.map[this.getKey(word)];
      --this.length;
    },
    
    // Clones itself
    clone: function() {
      var wordMap = new WordMap();
      
      for (var key in this.map) {
        if (! this.map.hasOwnProperty(key)) {
          continue;
        }
        
        var value = this.map[key];
        
        if (Object.prototype.toString.call(value) === '[object Undefined]') {
          continue;
        }
        
        if (Object.prototype.toString.call(value.clone) === '[object Function]') {
          value = value.clone();
        }
        
        wordMap.put(key, value);
      }
      
      return wordMap;
    }
  };
  
  
  // Matcher for pairwise combinations of words
  function PairMatcher(words) {
    this.init(words);
  }
  
  PairMatcher.prototype = {
    // Initially calculates all matches
    init: function(words) {
      this.matchMap = new WordMap();
      this.matchCountMap = new WordMap();
      
      for (var i = 0; i < words.length; ++i) {
        var matchCount = 0;
        this.matchMap.put(words[i], new WordMap());
        
        for (var j = 0; j < i; ++j) {
          var matches = this.matchMap.get(words[j]).get(words[i]);
          this.matchMap.get(words[i]).put(words[j], this.invertMatches(matches));
          matchCount += matches.length;
        }
        
        for (var j = i + 1; j < words.length; ++j) {
          var matches = this.findMatches(words[i], words[j]);
          this.matchMap.get(words[i]).put(words[j], matches);
          matchCount += matches.length;
        }
        
        this.matchCountMap.put(words[i], matchCount);
      }
    },
    
    // Returns all matches
    getMatches: function(word1, word2) {
      return this.matchMap.get(word1).get(word2);
    },
    
    // Return total number of matches
    getMatchCount: function(word) {
      return this.matchCountMap.get(word);
    },
    
    // Finds all matches of two words
    findMatches: function(word1, word2) {
      var string1 = word1.value;
      var string2 = word2.value;
      var matches = [];
      
      for (var i = 0; i < string1.length; ++i) {
        var match = string2.indexOf(string1[i]);
        
        while (match >= 0) {
          matches.push([i,match]);
          match = string2.indexOf(string1[i], match + 1);
        }
      }
      return matches;
    },
    
    // Inverts matches
    invertMatches: function(matches) {
      var invertedMatches = [];
      
      for (var i = 0; i < matches.length; ++i) {
        invertedMatches.push([matches[i][1], matches[i][0]]);
      }
      
      return invertedMatches;
    }
  };
  
  
  // Crossword coordinate
  function Coordinate(x,y) {
    this.x = x;
    this.y = y;
  }
  
  
  // Crossword
  function Crossword() {
    this.words = [];
    this.length = 0;
    
    this.indexMap = null;
    
    this.minXIndex = null;
    this.maxXIndex = null;
    
    this.minYIndex = null;
    this.maxYIndex = null;
  }
  
  Crossword.prototype = {
    // Adds a word to the crossword
    add: function(word) {
      this.words.push(word);
      ++this.length;
    },
    
    // Removes and returns the last added word
    pop: function() {
      --this.length;
      return this.words.pop();
    },
    
    // Returns word for index
    get: function(index) {
      return this.words[index];
    },
    
    // Converts an index pair to a key for the index map
    getKey: function(x,y) {
      return x + ',' + y;
    },
    
    // Updates minimum and maximum indexes
    updateIndexRange: function(x1, x2, y1, y2) {
      if (this.minXIndex === null || x1 < this.minXIndex) {
        this.minXIndex = x1;
      }
      
      if (this.maxXIndex === null || x2 > this.maxXIndex) {
        this.maxXIndex = x2;
      }
      
      if (this.minYIndex === null || y1 < this.minYIndex) {
        this.minYIndex = y1;
      }
      
      if (this.maxYIndex === null || y2 > this.maxYIndex) {
        this.maxYIndex = y2;
      }
    },
    
    // Checks if the index map has already been created
    hasIndexMap: function() {
      return (this.indexMap !== null);
    },
    
    // (Re)generates the index map
    buildIndexMap: function() {
      this.indexMap = {};
      
      for (var i = 0; i < this.words.length; ++i) {
        var word = this.words[i];
        
        if (word.orientation === ORIENTATION.HORIZONTAL) {
          this.updateIndexRange(word.start.x - 1, word.start.x + word.length - 1, word.start.y, word.start.y);
          
          this.indexMap[this.getKey(word.start.x - 1, word.start.y)] = 'H' + word.number;
          for (var j = 0; j < word.length; ++j) {
            this.indexMap[this.getKey(word.start.x + j, word.start.y)] = word.charAt(j);
          }
        } else {
          this.updateIndexRange(word.start.x, word.start.x, word.start.y - 1, word.start.y + word.length - 1);
          
          // Update index map
          this.indexMap[this.getKey(word.start.x, word.start.y - 1)] = 'V' + word.number;
          for (var j = 0; j < word.length; ++j) {
            this.indexMap[this.getKey(word.start.x, word.start.y + j)] = word.charAt(j);
          }
        }
      }
    },
    
    // Returns character for index pair
    charAt: function(x,y) {
      var value = this.indexMap[this.getKey(x,y)];
      return (value === undefined) ? '' : value;
    }
  };
  
  
  // Crossword generator
  function Generator(words) {
    this.words = words;
    this.pairMatcher = new PairMatcher(words);
    this.crosswordMatcher = new CrosswordMatcher();
  }
  
  Generator.prototype = {
    // Tries to generate a crossword
    generate: function() {
      // Check input
      if (this.words === undefined || this.words === null || this.words.length === 0) {
        return null;
      }
      
      // Sort words by number of matches (low to high)
      var matcher = this.pairMatcher;
      this.words.sort(function(word1, word2) {
        var c1 = matcher.getMatchCount(word1);
        var c2 = matcher.getMatchCount(word2);
        return (c1 > c2) ? 1 : ((c1 < c2) ? -1 : 0);
      });
      
      // Check if any word cannot be matched
      if (this.pairMatcher.getMatchCount(this.words[0]) === 0) {
        return null;
      }
      
      // Initialize generator state
      var state = new GeneratorState(this.words);
      
      var firstWord = state.remainingWords.pop();
      firstWord.start.x = 0;
      firstWord.start.y = 0;
      firstWord.orientation = ORIENTATION.HORIZONTAL;
      state.crossword.add(firstWord);
      
      state.step = new GeneratorStep({
        wordIndex: state.remainingWords.length - 1,
        matchWordIndex: 0,
        matchIndex: 0
      });
      
      var counter = 0; // Counter to avoid infinite loop
      
      while (true) {
        // Are we done?
        if (state.remainingWords.length === 0) {
          return state;
        }
        
        // Is this a dead end?
        if (state.step.wordIndex < 0) {
          if (state.stepStack.length > 0) { // Undo last step
            state.step = state.stepStack.pop();
            ++state.step.matchIndex;
            
            var lastWord = state.crossword.pop();
            state.remainingWords.splice(state.step.wordIndex, 0, lastWord);
          } else { // Generation failed
            return null;
          }
        }
        
        // Try to match remaining words
        while (state.step.wordIndex >= 0) {
          var word = state.remainingWords[state.step.wordIndex];
          var matched = false;

          // Try to match with placed words
          while (state.step.matchWordIndex < state.crossword.length) {
            var matchWord = state.crossword.get(state.step.matchWordIndex);
            var matches = this.pairMatcher.getMatches(word, matchWord);
            
            // Try matches
            while (state.step.matchIndex < matches.length) {
              var match = matches[state.step.matchIndex];
              
              // Calculate new word starting point and orientation
              if (matchWord.orientation === ORIENTATION.HORIZONTAL) {
                word.orientation = ORIENTATION.VERTICAL;
                word.start.x = matchWord.start.x + match[1];
                word.start.y = matchWord.start.y - match[0];
              } else {
                word.orientation = ORIENTATION.HORIZONTAL;
                word.start.x = matchWord.start.x - match[0];
                word.start.y = matchWord.start.y + match[1];
              }
              
              // Check if match is possible
              if (this.crosswordMatcher.wordMatches(word, state.crossword)) {
                // Push current step onto the stack
                state.stepStack.push(state.step.clone());
                
                // Move word from remaining words to crossword
                state.crossword.add(word);
                state.remainingWords.splice(state.step.wordIndex,1);
                
                // Exit loop over matches
                matched = true;
                break;
              }
              
              // Proceed with next match
              ++state.step.matchIndex;
            }
            
            if (matched) { // Exit loop over placed words
              break;
            }
            
            // Proceed with next placed word
            ++state.step.matchWordIndex;
            state.step.matchIndex = 0;
          }
          
          if (matched) { // Restart loop over all remaining words
            state.step.wordIndex =  state.remainingWords.length - 1;
          } else { // Proceed with next word
            --state.step.wordIndex;
          }
          
          state.step.matchWordIndex = 0;
          state.step.matchIndex = 0;
        }
        
        ++counter;
        if (counter > 1000) return null; // Should not happen! :(
      }
      
      return null;
    }
  };
  
  
  // Step of the crossword generator
  function GeneratorStep(options) {
    this.wordIndex = options.wordIndex; // Index of last placed word in remaining words array
    this.matchWordIndex = options.matchWordIndex; // Index of last matched word in crossword
    this.matchIndex = options.matchIndex; // Index of last match in match array
  }
  
  GeneratorStep.prototype = {
    // Clones itself
    clone: function() {
      return new GeneratorStep({
        wordIndex: this.wordIndex,
        matchWordIndex: this.matchWordIndex,
        matchIndex: this.matchIndex
      });
    }
  };
  
  
  // State of the crossword generator
  function GeneratorState(words) {
    this.crossword = new Crossword();
    this.remainingWords = words;
    this.step = null;
    this.stepStack = [];
  }
  
  
  // Matcher for words and crosswords
  function CrosswordMatcher() {
  }
  
  CrosswordMatcher.prototype = {
    // Checks if a word matches an existing crossword
    wordMatches: function(word, crossword) {
      for (var i = 0; i < crossword.length; ++i) {
        if (this.wordsInterfere(word, crossword.get(i))) {
          return false;
        }
      }
      
      return true;
    },
    
    // Checks if two words interfere
    wordsInterfere: function(word1, word2) {
      if (word1.orientation === word2.orientation) {
        return this.parallelWordsInterfere(word1, word2);
      } else {
        return this.perpendicularWordsInterfere(word1, word2);
      }
    },
    
    // Checks if two parallel words interfere
    parallelWordsInterfere: function(word1, word2) {
      var diff = null;
      var start1 = null;
      var start2 = null;
      var end1 = null;
      var end2 = null;
      
      if (word1.orientation === ORIENTATION.HORIZONTAL && word2.orientation === ORIENTATION.HORIZONTAL) {
        diff = Math.abs(word1.start.y - word2.start.y);
        start1 = word1.start.x - 1; // Account for clue marker
        start2 = word2.start.x - 1; // Account for clue marker
        end1 = word1.start.x + word1.length;
        end2 = word2.start.x + word2.length;
      } else if (word1.orientation === ORIENTATION.VERTICAL && word2.orientation === ORIENTATION.VERTICAL) {
        diff = Math.abs(word1.start.x - word2.start.x);
        start1 = word1.start.y - 1; // Account for clue marker
        start2 = word2.start.y - 1; // Account for clue marker
        end1 = word1.start.y + word1.length;
        end2 = word2.start.y + word2.length;
      }
      
      switch (diff) {
        case 0: // Words on same row / column
          if (start1 >= start2 - 1 && start1 <= end2) { // Word 1 starts within word 2
            return true;
          }
          if (end1 >= start2 && end1 <= end2 + 1) { // Word 1 ends within word 2
            return true;
          }
          if (start1 <= start2 && end1 >= end2) { // Word 1 encloses word 2
            return true;
          }
          break;
          
        case 1: // Words on adjacent rows / columns
          if (start1 >= start2 && start1 <= end2 - 1) { // Word 1 starts within word 2
            return true;
          }
          if (end1 >= start2 + 1 && end1 <= end2) { // Word 1 ends within word 2
            return true;
          }
          if (start1 <= start2 && end1 >= end2) { // Word 1 encloses word 2
            return true;
          }
          break;
      }
      
      return false;
    },
    
    // Checks if two perpendicular words interfere
    perpendicularWordsInterfere: function(word1, word2) {
      if (word1.orientation === ORIENTATION.VERTICAL && word2.orientation === ORIENTATION.HORIZONTAL) {
        // Exchange roles of word1 and word2
        var tmp = word1;
        word1 = word2;
        word2 = tmp;
      }
      
      var start2 = word2.start.y - 1; // Account for clue marker
      var end2 = word2.start.y + word2.length;
      
      if (word1.start.y === end2 + 1) { // Adjacent words
        return true;
      }
      
      if (word1.start.y >= start2 && word1.start.y <= end2) { // Intersecting words
        var idx1 = word2.start.x - word1.start.x;
        var idx2 = word1.start.y - word2.start.y;
        
        if (idx1 < 0 || idx2 < 0) { // Intersection at clue marker
          return true;
        }
        
        if (word1.charAt(idx1) !== word2.charAt(idx2)) { // 
          return true;
        }
      }
      
      return false;
    }
  };
  
  
  // Crossword renderer
  function CrosswordRenderer() {
  }
  
  CrosswordRenderer.prototype = {
    // Renders a crossword to an HTML element
    render: function(crossword, clueRenderer, rotate) {
      if (crossword === null) {
        return null;
      }
      
      if (! crossword.hasIndexMap()) {
        crossword.buildIndexMap();
      }
      
      var $table = $('<table>').addClass('puzzle');
      
      var yMin = (rotate === false) ? crossword.minYIndex : crossword.minXIndex;
      var yMax = (rotate === false) ? crossword.maxYIndex : crossword.maxXIndex;
      var xMin = (rotate === false) ? crossword.minXIndex : crossword.minYIndex;
      var xMax = (rotate === false) ? crossword.maxXIndex : crossword.maxYIndex;
      
      for (var y = yMin; y <= yMax; ++y) {
        var $tr = $('<tr>');
        
        for (var x = xMin; x <= xMax; ++x) {
          var $td = $('<td>');
          var value = (rotate === false) ? crossword.charAt(x,y) : crossword.charAt(y,x);
          
          if (value.length > 0) {
            if (value.match(/[HV]\d*/) !== null) {
              $td.addClass('clue');
              
              var $canvas = $('<canvas>').attr('width', '100').attr('height', '100');
              
              if (value[0] === 'H') {
                $canvas.addClass((rotate === false) ? 'horizontal' : 'vertical');
              } else if (value[0] === 'V') {
                $canvas.addClass((rotate === false) ? 'vertical' : 'horizontal');
              }
              
              clueRenderer($canvas, value.slice(1));
              
              $td.append($canvas);
            } else {
              $td.addClass('letter');
              $td.html(value.toUpperCase());
            }
          }
          
          $tr.append($td);
        }
        
        $table.append($tr);
      }
      
      return $table;
    }
  };
  
  
  // Main plugin function
  $.crossword = function(command, options) {
    switch (command) {
      case 'generate':
        return generate(options);
      case 'render':
        return render(options);
    }
  }
  
  
  // Generates a new crossword
  function generate(options) {
    var opts = $.extend({
      words: [],
      clues: []
    }, options);
    
    if (opts.words.length === 0 || opts.clues.length === 0 ||
        opts.words.length !== opts.clues.length) {
      return null;
    }
    
    var words = [];
    for (var i = 0; i < opts.words.length; ++i) {
      words.push(new Word(i + 1, opts.words[i], opts.clues[i]));
    }
    
    var generator = new Generator(words);
    var state = generator.generate();
    
    return (state !== null) ? state.crossword : null;
  }
  
  
  // Renders a crossword
  function render(options) {
    var opts = $.extend({
      crossword: null,
      clueRenderer: function($canvas, number) {},
      rotate: false
    }, options);
    
    return (new CrosswordRenderer()).render(opts.crossword, opts.clueRenderer, opts.rotate);
  }

})(jQuery);
