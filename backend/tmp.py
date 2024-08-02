from indictrans import Transliterator
from LID_tool.getLanguage import langIdentify
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import time

hing_bert_start_time = time.time()
tokenizer = AutoTokenizer.from_pretrained("l3cube-pune/hing-bert-lid")

model = AutoModelForTokenClassification.from_pretrained(
    "l3cube-pune/hing-bert-lid")

nerpipeline = pipeline('ner', model=model, tokenizer=tokenizer)
text = "Hi mera name USER hai"

# trn = Transliterator(source='eng', target='hin', build_lookup=True)
# text = trn.transform(text)
# print(text)

arr = nerpipeline(text)
hing_bert_end_time = time.time()

for elem in arr:
    print(elem)

print('\n\n')

ms_start_time = time.time()
sentence = text
lang = langIdentify(sentence, 'classifiers/HiEn.classifier')
ms_end_time = time.time()
print(lang)


print('Time taken by Hing Bert: ', hing_bert_end_time - hing_bert_start_time)
print('Time taken by Microsoft LID: ', ms_end_time - ms_start_time)

