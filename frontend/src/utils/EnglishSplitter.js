const detectURLs = (message) => {
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  return message.match(urlRegex);
}

const detectHashtags = (message) => {
  var hashRegex = /\B\#\w\w+\b/g
  var result = message.match(hashRegex);
  if (result) {
      return result;
  } else {
      return false;
  }
}

const EnglishSplitter = (sentence) => {
    // const sent = sentence.match(/\b(\w+)\b/g);
    const hashs = detectHashtags(sentence) ? detectHashtags(sentence) : [];
    //console.log(hashs);
    const links = detectURLs(sentence) ? detectURLs(sentence) : [];
   // console.log(links);
    let sent = sentence;

    links.map(link => {
        sent = sent.replace(link, "");
    });
   // console.log(sent)
    sent = sent.match(/\b([\w+^']+)\b/g)
   // console.log(sent);
    return {sent, links, hashs};
};

export default EnglishSplitter;