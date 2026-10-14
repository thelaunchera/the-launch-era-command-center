import assert from "node:assert/strict";
import {evaluateSyntheticFollowup as decide} from "../overrides/assets/booking-studio-followup-rules.mjs";
const now=Date.parse("2026-10-14T20:00:00Z");
const sample={synthetic_only:true,confirmed:false,customer_notified:false,consent_to_contact:true,kind:"booking_request",created_at:"2026-10-13T18:00:00Z"};
const result=decide(sample,{now,language:"en"});
assert.equal(result.eligible,true);
assert.equal(result.stage,"followup");
assert.equal(result.simulation_only,true);
for(const [patch,reason] of [
 [{synthetic_only:false},"synthetic"],
 [{confirmed:true},"synthetic"],
 [{customer_notified:true},"synthetic"],
 [{consent_to_contact:false},"Consent"],
 [{created_at:"2026-10-14T19:00:00Z"},"24 hours"],
 [{created_at:"2026-09-01T19:00:00Z"},"14 days"],
 [{created_at:"2026-10-15T19:00:00Z"},"future"]
]){
 const value=decide({...sample,...patch},{now,language:"en"});
 assert.equal(value.eligible,false);
 assert(value.reason.includes(reason),value.reason);
}
assert.equal(decide(sample,{now,language:null}).eligible,false);
assert.equal(decide(sample,{now,language:"fr"}).eligible,false);
assert.equal(decide(sample,{now,language:"es",alreadySent:true}).eligible,false);
const quote={...sample,kind:"quote_request"};
assert.equal(decide(quote,{now,language:"es"}).eligible,false);
assert.equal(decide(quote,{now,language:"es",quoteReady:true}).stage,"quote");
console.log("PASS synthetic follow-up decision: consent, language, duplicate, 24h wait, 14d cutoff, quote review, no send.");
