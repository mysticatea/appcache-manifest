import {writeFileSync} from "fs";
import assert from "power-assert";
import {sync as removeSync} from "rimraf";
import {setup, content, execCommandToWatch} from "./lib/util";

describe("appcache-manifest", () => {
  before(() => {
    removeSync("test-ws1");
    removeSync("test-ws2");
  });
  beforeEach(() => {
    setup({
      "test-ws1/a.txt": "AAA",
      "test-ws1/b.txt": "BBB",
      "test-ws1/c.dat": "Not includes",
      "test-ws1/d/d.txt": "DDD",
      "test-ws1/post1": "POST1"
    });
  });
  afterEach(() => {
    removeSync("test-ws1");
    removeSync("test-ws2");
  });

  //----------------------------------------------------------------------------
  describe("--watch option", () => {
    it("should regenerate when the file changed.", () => {
      return execCommandToWatch("\"test-ws1/**/*.txt\" -o test-ws2/result.appcache --watch")
        .then((cp) => {
          writeFileSync("test-ws1/a.txt", "aaa");
          return cp.waitForDone();
        })
        .then((cp) => {
          return cp.kill();
        })
        .then(() => {
          assert(content("test-ws2/result.appcache") === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7304c2648e9b72d26604ff08b1ef8e89
`);
        });
    });

    it("should regenerate when the file added.", () => {
      return execCommandToWatch("\"test-ws1/**/*.txt\" -o test-ws2/result.appcache --watch")
        .then((cp) => {
          writeFileSync("test-ws1/e.txt", "EEE");
          return cp.waitForDone();
        })
        .then((cp) => {
          return cp.kill();
        })
        .then(() => {
          assert(content("test-ws2/result.appcache") === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
/e.txt
#9bb4f5944df558521e3700bfab79b1a2
`);
        });
    });

    it("should regenerate when the file removed.", () => {
      return execCommandToWatch("\"test-ws1/**/*.txt\" -o test-ws2/result.appcache --watch")
        .then((cp) => {
          removeSync("test-ws1/b.txt");
          return cp.waitForDone();
        })
        .then((cp) => {
          return cp.kill();
        })
        .then(() => {
          assert(content("test-ws2/result.appcache") === `CACHE MANIFEST
/a.txt
/d/d.txt
#d9994d1af63843e51ba5cd9c4095d5e3
`);
        });
    });
  });

});
