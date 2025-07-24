const HindiSplitter = (sentence="नमस्ते, यह शुभ है। यह एक एनोटेशन टूल है।") => {
    let sent = sentence.replace(/,/g, "");
    sent = sent.replace(/;/g, "");
    sent = sent.replace(/।/g, "");
    // console.log('CHAR: ', /[u{U+007C}]/);

    return sent.split(' ');
};

export default HindiSplitter;