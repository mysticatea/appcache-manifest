import assert from "power-assert";
import {sync as removeSync} from "rimraf";
import {setup, content, execCommand} from "./lib/util";

describe("appcache-manifest", () => {
  before(() => {
    removeSync("test-ws1");
    removeSync("test-ws2");
    removeSync("test-ws3");
  });
  beforeEach(() => {
    setup({
      "test-ws1/a.txt": "AAA",
      "test-ws1/b.txt": "BBB",
      "test-ws1/c.dat": "Not includes",
      "test-ws1/d/d.txt": "DDD",
      "test-ws1/post1": "POST1",
      "test-ws1/post2": "POST2",
      "test-ws2/a.txt": "AAA",
      "test-ws2/b.txt": "BBB",
      "test-ws2/c.dat": "Not includes",
      "test-ws2/d/d.txt": "DDD"
    });
  });
  afterEach(() => {
    removeSync("test-ws1");
    removeSync("test-ws2");
    removeSync("test-ws3");
  });

  //----------------------------------------------------------------------------
  describe("should generate paths and fingerpoint in CACHE section.", () => {
    it("with single glob.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\"");
      assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
`);
    });

    it("with multiple globs.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\" \"test-ws2/**/*.txt\"");
      assert(result === `CACHE MANIFEST
/test-ws1/a.txt
/test-ws1/b.txt
/test-ws1/d/d.txt
/test-ws2/a.txt
/test-ws2/b.txt
/test-ws2/d/d.txt
#7ccc78fc61b9f1daff3b91e263772392
`);
    });
  });

  //----------------------------------------------------------------------------
  describe("--output option", () => {
    it("should create the file.", () => {
      execCommand("\"test-ws1/**/*.txt\" --output test-ws3/test.appcache");
      assert(content("test-ws3/test.appcache") === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
`);
    });
  });

  //----------------------------------------------------------------------------
  describe("--prefix option", () => {
    it("should concatenate before URL-path.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\" --prefix /z");
      assert(result === `CACHE MANIFEST
/z/a.txt
/z/b.txt
/z/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
`);
    });

    it("should fail if is specified 2 or more.", () => {
      assert.throws(() => execCommand("\"test-ws1/**/*.txt\" --prefix /z --prefix /y"));
    });

    it("should fail if is specified non-absolute-path.", () => {
      assert.throws(() => execCommand("\"test-ws1/**/*.txt\" --prefix z"));
    });
  });

  //----------------------------------------------------------------------------
  describe("--postfile option", () => {
    it("should concatenate the file's content after the generated contents.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\" --postfile test-ws1/post1");
      assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
POST1
`);
    });

    it("should concatenate the all files.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\" --postfile test-ws1/post1 --postfile test-ws1/post2");
      assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
POST1
POST2
`);
    });

    it("should fail if the file not found.", () => {
      assert.throws(() => execCommand("\"test-ws1/**/*.txt\" --postfile test-ws1/post3"));
    });
  });

  //----------------------------------------------------------------------------
  describe("--verbose option", () => {
    it("should fail if there is not --output option.", () => {
      assert.throws(() => execCommand("\"test-ws1/**/*.txt\" --verbose"));
    });
  });

  //----------------------------------------------------------------------------
  describe("--notwork-star option", () => {
    it("should append \"NETWORK:\\n*\" into the generated contents.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\" --network-star");
      assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
NETWORK:
*
`);
    });

    it("should append it after postfiles.", () => {
      const result = execCommand("\"test-ws1/**/*.txt\" --network-star --postfile test-ws1/post1");
      assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
POST1
NETWORK:
*
`);
    });
  });

});
