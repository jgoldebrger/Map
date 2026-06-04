import {
  getShippingRefusalMessage,
  isOffTopicShippingQuestion,
} from "../src/lib/ai/shipping-scope";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(isOffTopicShippingQuestion("give me a joke"), "joke request should be off-topic");
assert(isOffTopicShippingQuestion("tell me a riddle"), "riddle should be off-topic");
assert(!isOffTopicShippingQuestion("next ship date for Monroe County, FL"), "county ship question allowed");
assert(!isOffTopicShippingQuestion("when does 33070 ship"), "zip ship question allowed");
assert(!isOffTopicShippingQuestion("what is the cutoff for CCDT Florida"), "cutoff question allowed");
assert(getShippingRefusalMessage().includes("shipping schedules"), "refusal mentions shipping");

console.log("shipping-scope tests passed");
