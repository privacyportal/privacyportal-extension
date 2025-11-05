import { tinyArrayShuffle } from '../arrayUtils';

function tokenizeSearchInput(input) {
  return [
    input,
    ...input
      .split(/[,.\-_ :/\\]+/)
      .filter((s) => s.length > 2 && s.length < input.length)
      .sort((a, b) => b.length - a.length)
      .slice(0, 3)
  ];
}

export async function encryptAddressData(address, cryptoTasks) {
  const [ct, ...srch] = await Promise.all([
    cryptoTasks.encryptStr(JSON.stringify(address)),
    ...tokenizeSearchInput(address.label).map(function (input) {
      return cryptoTasks.hashStr(input);
    })
  ]);
  return {
    ct,
    srch: tinyArrayShuffle(srch)
  };
}
