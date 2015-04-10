function max (array){
  return Math.max.apply(Math, array);
};

function min (array){
  return Math.min.apply(Math, array);
};

function levenshtein_distance_helper(string1, index1, string2, index2) {

  if (index1 == 0) {
    return 0;
  }
  if (index2 == 0) {
    return 0;
  }
  var cost = 0;
  if (string1[index1-1] == string2[index2-1]) {
    cost = 0;
  } else {
    cost = 1;
  }

  return min([
    levenshtein_distance_helper(string1, index1-1, string2, index2) + 1,
    levenshtein_distance_helper(string1, index1, string2, index2-1) + 1,
    levenshtein_distance_helper(string1, index1-1, string2, index2-1) + cost
  ]);
}

function levenshtein_distance(string1, string2) {
  return levenshtein_distance_helper(string1, string1.length, string2, string2.length);
}

module.exports = {
  levenshtein_distance: levenshtein_distance
}
