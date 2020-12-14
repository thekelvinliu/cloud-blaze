import b2ProxyHandler from "..";

addEventListener("fetch", (event) => {
  event.respondWith(b2ProxyHandler({ event }));
});
