const LanguageDetect = (sentence) => {
  const LanguageDetect = require("languagedetect");
  const lngDetector = new LanguageDetect();

  // OR
  // const lngDetector = new (require('languagedetect'));

  const val = lngDetector.detect(sentence);
  //console.log(val);
  let en = 0,
    hi = 0;

  val.map((elem) => {
    if (elem[0] === "english") {
      en = elem[1];
      console.log("En: ", elem[1]);
    } else if (elem[0] === "hindi") {
      hi = elem[1];
      console.log("Hi: ", elem[1]);
    }
  });

  return { 'en': en, 'hi': hi };
};

export default LanguageDetect;