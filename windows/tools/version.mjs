// Stable version codes are explicit Android build metadata, never SemVer patches.
const canonical=/^(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})(?:-preview\.(0|[1-9][0-9]{0,8}))?$/;
export function buildVersion(version,androidGradle){
  const match=typeof version==='string'&&canonical.exec(version);
  if(!match||match[0]!==version)throw Error('Review distribution version.');
  const codes=[...androidGradle.matchAll(/^\s*versionCode\s+([1-9][0-9]{0,9})\s*$/gm)];
  const names=[...androidGradle.matchAll(/^\s*versionName\s+"([^"]+)"\s*$/gm)];
  if(codes.length!==1||names.length!==1||names[0][1]!==version)throw Error('Android and Windows version metadata must match.');
  const code=Number(codes[0][1]);
  if(!Number.isSafeInteger(code)||code>2147483647||match[4]!==undefined&&Number(match[4])!==code)throw Error('Review explicit Android version code.');
  return {version,code};
}
