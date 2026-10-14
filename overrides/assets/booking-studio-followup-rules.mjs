/**
 * Deterministic owner-only simulation. Never schedules or sends anything.
 * A request's age is NOT consent to send, nor evidence that a quote is ready.
 */
export function evaluateSyntheticFollowup(record,{now=Date.now(),language=null,alreadySent=false,quoteReady=false}={}){
 const blocked=(reason)=>({eligible:false,stage:null,reason,simulation_only:true});
 if(!record||record.synthetic_only!==true||record.confirmed!==false||record.customer_notified!==false)return blocked("Record is not a verified, unconfirmed synthetic Testing request.");
 if(record.consent_to_contact!==true)return blocked("Consent missing or unverified.");
 if(!["booking_request","quote_request"].includes(record.kind))return blocked("Unsupported request type.");
 if(!["en","es"].includes(language))return blocked("Language must be explicitly selected; never infer it.");
 if(alreadySent)return blocked("Follow-up already marked as sent; duplicate prevention.");
 const timestamp=Date.parse(record.created_at||"");
 if(!Number.isFinite(timestamp)||!Number.isFinite(now)||timestamp>now)return blocked("Invalid or future request timestamp.");
 const hours=(now-timestamp)/3600000;
 if(hours<24)return blocked("Waiting period: follow-up review opens after 24 hours.");
 if(hours>24*14)return blocked("Request older than 14 days: manual review required.");
 if(record.kind==="quote_request"&&!quoteReady)return blocked("Quote is not confirmed ready: human review required.");
 return {eligible:true,stage:record.kind==="quote_request"?"quote":"followup",reason:"SIMULATION: Review a "+(record.kind==="quote_request"?"quote":"booking")+" follow-up draft. No sending authorized.",hours_since_request:Math.floor(hours),language,simulation_only:true};
}
