(function($) {
  'use strict';
  
  // Word orientation constants
  var ORIENTATION = {
    HORIZONTAL: -1,
    NONE: 0,
    VERTICAL: 1
  };
  
  
  // An individual word
  function Word(number, value) {
    this.number = number;
    this.value = value;
    this.length = value.length;
    
    this.start = new Coordinate(null, null);
    this.orientation = ORIENTATION.NONE;
  }
  
  Word.prototype = {
    // Returns character at index
    charAt: function(index) {
      return this.value[index];
    },
    
    // Clones itself
    clone: function() {
      var word = new Word(this.number, this.value);
      
      word.start = this.start.clone();
      word.orientation = this.orientation;
      
      return word;
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
        var j, matches;
        
        this.matchMap.put(words[i], new WordMap());
        
        for (j = 0; j < i; ++j) {
          matches = this.matchMap.get(words[j]).get(words[i]);
          this.matchMap.get(words[i]).put(words[j], this.invertMatches(matches));
          matchCount += matches.length;
        }
        
        for (j = i + 1; j < words.length; ++j) {
          matches = this.findMatches(words[i], words[j]);
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
  
  Coordinate.prototype = {
    // Clones itself
    clone: function() {
      return new Coordinate(this.x, this.y);
    }
  };
  
  
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
        var j;
        
        if (word.orientation === ORIENTATION.HORIZONTAL) {
          this.updateIndexRange(word.start.x - 1, word.start.x + word.length - 1, word.start.y, word.start.y);
          
          this.indexMap[this.getKey(word.start.x - 1, word.start.y)] = 'H' + word.number;
          for (j = 0; j < word.length; ++j) {
            this.indexMap[this.getKey(word.start.x + j, word.start.y)] = word.charAt(j);
          }
        } else {
          this.updateIndexRange(word.start.x, word.start.x, word.start.y - 1, word.start.y + word.length - 1);
          
          // Update index map
          this.indexMap[this.getKey(word.start.x, word.start.y - 1)] = 'V' + word.number;
          for (j = 0; j < word.length; ++j) {
            this.indexMap[this.getKey(word.start.x, word.start.y + j)] = word.charAt(j);
          }
        }
      }
    },
    
    // Returns character for index pair
    charAt: function(x,y) {
      var value = this.indexMap[this.getKey(x,y)];
      return (value === undefined) ? '' : value;
    },
    
    // Creates a DOM element representing the crossword
    createDOMElement: function() {
      if (! this.hasIndexMap()) {
        this.buildIndexMap();
      }
      
      var $table = $('<table>').addClass('crossword');
      
      for (var y = this.minYIndex; y <= this.maxYIndex; ++y) {
        var $tr = $('<tr>');
        
        for (var x = this.minXIndex; x <= this.maxXIndex; ++x) {
          var $td = $('<td>');
          var value = this.charAt(x,y);
          
          if (value.length > 0) {
            if (value.match(/[HV]\d+/) !== null) {
              $td.addClass('clue');
              
              if (value[0] === 'H') {
                $td.addClass('horizontal');
              } else if (value[0] === 'V') {
                $td.addClass('vertical');
              }
              
              $td.append($('<div>').html(value.slice(1)));
            } else {
              $td.addClass('letter');
              $td.append($('<div>').html(value));
            }
          }
          
          $tr.append($td);
        }
        
        $table.append($tr);
      }
      
      return $table;
    },
    
    // Clones itself
    clone: function() {
      var crossword = new Crossword();
      
      crossword.words = [];
      for (var i = 0; i < this.words.length; ++i) {
        crossword.words.push(this.words[i].clone());
      }
      
      crossword.length = this.length;
      
      if (this.indexMap !== null) {
        crossword.indexMap = {};
        
        for (var key in this.indexMap) {
          if (this.indexMap.hasOwnProperty(key)) {
            crossword.indexMap[key] = this.indexMap[key];
          }
        }
        
        crossword.minXIndex = this.minXIndex;
        crossword.maxXIndex = this.maxXIndex;
        crossword.minYIndex = this.minYIndex;
        crossword.maxYIndex = this.maxYIndex;
      }
      
      return crossword;
    }
  };
  
  
  // Crossword generator
  function CrosswordGenerator(debug) {
    this.state = null;
    this.crosswordMatcher = new CrosswordMatcher();
    this.logger = (debug === true) ? new ConsoleLogger() : null;
  }
  
  CrosswordGenerator.prototype = {
    // Initializes the generator
    init: function(words) {
      this.state = null; // Reset state
      
      // Check input
      if (words === undefined || words === null || words.length === 0) {
        return;
      }
      
      // Initialize generator state
      var state = new GeneratorState(words);
      
      // Sort remaining words by number of matches (low to high)
      var matcher = state.pairMatcher;
      state.remainingWords.sort(function(word1, word2) {
        var c1 = matcher.getMatchCount(word1);
        var c2 = matcher.getMatchCount(word2);
        return (c1 > c2) ? 1 : ((c1 < c2) ? -1 : 0);
      });
      
      // Check if any word cannot be matched
      if (matcher.getMatchCount(state.remainingWords[0]) === 0) {
        return;
      }
      
      // Place first word
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
      
      this.state = state;
    },
    
    // Tries to generate the next crossword alternative
    generateNext: function() {
      if (this.state === null) {
        return null;
      }

      var counter = 0; // Counter to avoid infinite loop
      
      if (this.canRollback()) { // Rollback last step for next attempt
        this.rollbackForNextAttempt();
      }
      
      while (true) {
        if (this.logger !== null) {
          this.logger.logCrossword(this.state.crossword);
        }
        
        // Are we done?
        if (this.state.remainingWords.length === 0) {
          return this.state.crossword.clone();
        }
        
        // Is this a dead end?
        if (this.state.step.wordIndex < 0) {
          if (this.canRollback()) {
            this.rollbackForNextAttempt();
          } else { // Generation failed
            return null;
          }
        }
        
        // Try to match remaining words
        while (this.state.step.wordIndex >= 0) {
          var word = this.state.remainingWords[this.state.step.wordIndex];
          var matched = false;
          
          if (this.logger !== null) {
            this.logger.logWord(word, 'Trying to match');
          }

          // Try to match with placed words
          while (this.state.step.matchWordIndex < this.state.crossword.length) {
            var matchWord = this.state.crossword.get(this.state.step.matchWordIndex);
            var matches = this.state.pairMatcher.getMatches(word, matchWord);
            
            // Try matches
            while (this.state.step.matchIndex < matches.length) {
              var match = matches[this.state.step.matchIndex];
              
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
              if (this.crosswordMatcher.wordMatches(word, this.state.crossword)) {
                // Push current step onto the stack
                this.state.stepStack.push(this.state.step.clone());
                
                // Move word from remaining words to crossword
                this.state.crossword.add(word);
                this.state.remainingWords.splice(this.state.step.wordIndex,1);
                
                // Exit loop over matches
                matched = true;
                break;
              }
              
              // Proceed with next match
              ++this.state.step.matchIndex;
            }
            
            if (matched) { // Exit loop over placed words
              break;
            }
            
            // Proceed with next placed word
            ++this.state.step.matchWordIndex;
            this.state.step.matchIndex = 0;
          }
          
          if (matched) { // Restart loop over all remaining words
            this.state.step.wordIndex =  this.state.remainingWords.length - 1;
            
            if (this.logger !== null) {
              this.logger.log('Succeeded');
            }
          } else { // Proceed with next word
            --this.state.step.wordIndex;
            
            if (this.logger !== null) {
              this.logger.log('Failed');
            }
          }
          
          this.state.step.matchWordIndex = 0;
          this.state.step.matchIndex = 0;
        }
        
        ++counter;
        if (counter > 1000) { // Should not happen! :(
          return null;
        }
      }
      
      return null;
    },
    
    // Checks whether a rollback is possible in the current state
    canRollback: function() {
      return (this.state !== null && this.state.stepStack.length > 0);
    },
    
    // Performs a rollback of the last generator step
    rollbackForNextAttempt: function() {
      if (! this.canRollback()) {
        return;
      }
      
      // Undo last step
      var lastWord = this.state.crossword.pop();
      this.state.step = this.state.stepStack.pop();
      this.state.remainingWords.splice(this.state.step.wordIndex, 0, lastWord);
      
      // Increase match index for next attempt
      ++this.state.step.matchIndex;
      
      if (this.logger !== null) {
        this.logger.logWord(lastWord, 'Rolling back');
      }
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
    this.pairMatcher = new PairMatcher(words);
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
        end1 = word1.start.x + word1.length - 1;
        end2 = word2.start.x + word2.length - 1;
      } else if (word1.orientation === ORIENTATION.VERTICAL && word2.orientation === ORIENTATION.VERTICAL) {
        diff = Math.abs(word1.start.x - word2.start.x);
        start1 = word1.start.y - 1; // Account for clue marker
        start2 = word2.start.y - 1; // Account for clue marker
        end1 = word1.start.y + word1.length - 1;
        end2 = word2.start.y + word2.length - 1;
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
      var end2 = word2.start.y + word2.length - 1;
      
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
  
  
  // Logger for outputting debug information to console
  function ConsoleLogger() {
  }
  
  ConsoleLogger.prototype = {
    // Logs a message
    log: function(message) {
      console.log(message);
    },
    
    // Logs a word
    logWord: function(word, message) {
      var msg = (typeof message !== undefined) ? message : '';
      
      console.log(msg, word.value);
    },
    
    // Logs a crossword
    logCrossword: function(crossword) {
      console.log('Crossword {');
      
      for (var i = 0; i < crossword.length; ++i) {
        var word = crossword.get(i);
        var orientation = 'none';
        
        if (word.orientation === ORIENTATION.HORIZONTAL) {
          orientation = 'horizontal';
        } else if (word.orientation === ORIENTATION.VERTICAL) {
          orientation = 'vertical';
        }
        
        console.log('\t', word.value, '(' + word.start.x + ',' + word.start.y + ')', orientation);
      }
      
      console.log('}');
    }
  };
  
  
  // Global variables holding the plugin state
  var theGenerator = null;
  
  
  // Main plugin function
  $.crosswordGenerator = function(command, options) {
    // Function to initialize the generator with a new set of words
    var init = function(options) {
      var opts = $.extend({
        words: [],
        debug: false
      }, options);
      
      var words = [];
      for (var i = 0; i < opts.words.length; ++i) {
        words.push(new Word(i + 1, opts.words[i].toUpperCase()));
      }
      
      theGenerator = new CrosswordGenerator(opts.debug);
      theGenerator.init(words);
    };
    
    // Function to generate the next alternative
    var generateNext = function() {
      return theGenerator.generateNext();
    };
    
    switch (command) {
      case 'init':
        return init(options);
      case 'generate-next':
        return generateNext();
    }
  };

})(jQuery);
