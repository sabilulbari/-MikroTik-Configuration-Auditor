import { describe, it, expect } from "vitest";
import { parseRouterOSConfig } from "../lib/parser/routerosParser";
import { stripComments, tokenizeCommandLine, parseTokensToParams } from "../lib/parser/parserUtils";

describe("RouterOS Parser Utilities", () => {
  it("strips comments while preserving hash inside quotes", () => {
    expect(stripComments("/ip address add address=1.1.1.1 # comment")).toBe(
      "/ip address add address=1.1.1.1"
    );
    expect(stripComments('add comment="Network #1" interface=ether1')).toBe(
      'add comment="Network #1" interface=ether1'
    );
    expect(stripComments("# full line comment")).toBe("");
  });

  it("tokenizes commands respecting quoted strings", () => {
    const line = 'add address=192.168.1.1/24 comment="Office LAN" interface=ether2';
    const tokens = tokenizeCommandLine(line);
    expect(tokens).toEqual([
      "add",
      "address=192.168.1.1/24",
      'comment="Office LAN"',
      "interface=ether2",
    ]);
  });

  it("parses key=value parameters and strips surrounding quotes", () => {
    const tokens = ["address=192.168.1.1/24", 'comment="Office LAN"', "disabled=no", "dynamic"];
    const { params, flags } = parseTokensToParams(tokens);
    expect(params.address).toBe("192.168.1.1/24");
    expect(params.comment).toBe("Office LAN");
    expect(params.disabled).toBe("no");
    expect(flags).toContain("dynamic");
  });
});

describe("RouterOS Configuration Parser", () => {
  it("parses multiple sections and commands correctly", () => {
    const exportConfig = `
      # RouterOS 7.14 export
      /ip address
      add address=192.168.88.1/24 interface=ether2 comment="LAN Gateway"
      add address=203.0.113.10/24 interface=ether1 comment="WAN IP"

      /ip pool
      add name=dhcp_pool ranges=192.168.88.10-192.168.88.254

      /ip firewall nat
      add chain=srcnat action=masquerade out-interface=ether1
    `;

    const ast = parseRouterOSConfig(exportConfig);

    expect(ast.sections.length).toBe(3);
    expect(ast.allCommands.length).toBe(4);

    const ipAddrSection = ast.sections.find((s) => s.path === "/ip address");
    expect(ipAddrSection).toBeDefined();
    expect(ipAddrSection.commands.length).toBe(2);
    expect(ipAddrSection.commands[0].params.address).toBe("192.168.88.1/24");
    expect(ipAddrSection.commands[0].params.interface).toBe("ether2");
    expect(ipAddrSection.commands[0].params.comment).toBe("LAN Gateway");

    const poolSection = ast.sections.find((s) => s.path === "/ip pool");
    expect(poolSection.commands[0].params.ranges).toBe("192.168.88.10-192.168.88.254");

    const natSection = ast.sections.find((s) => s.path === "/ip firewall nat");
    expect(natSection.commands[0].params.action).toBe("masquerade");
    expect(natSection.commands[0].params.chain).toBe("srcnat");
    expect(natSection.commands[0].params["out-interface"]).toBe("ether1");
  });

  it("handles inline section commands e.g. /ip route add gateway=192.168.1.1", () => {
    const config = `/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1`;
    const ast = parseRouterOSConfig(config);

    expect(ast.allCommands.length).toBe(1);
    expect(ast.allCommands[0].section).toBe("/ip route");
    expect(ast.allCommands[0].verb).toBe("add");
    expect(ast.allCommands[0].params["dst-address"]).toBe("0.0.0.0/0");
    expect(ast.allCommands[0].params.gateway).toBe("203.0.113.1");
  });

  it("handles line continuations with backslash", () => {
    const config = `
      /ip firewall filter
      add chain=forward \\
          action=drop \\
          connection-state=invalid
    `;
    const ast = parseRouterOSConfig(config);

    expect(ast.allCommands.length).toBe(1);
    expect(ast.allCommands[0].params.chain).toBe("forward");
    expect(ast.allCommands[0].params.action).toBe("drop");
    expect(ast.allCommands[0].params["connection-state"]).toBe("invalid");
  });

  it("safely handles empty and malformed configurations", () => {
    expect(parseRouterOSConfig("").allCommands).toEqual([]);
    expect(parseRouterOSConfig(null).allCommands).toEqual([]);
    expect(parseRouterOSConfig("   \n # only comments \n ").allCommands).toEqual([]);
  });
});
