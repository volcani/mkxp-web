
uniform mat4 projMat;

uniform vec2 texSizeInv;
uniform vec2 translation;

uniform float aniIndex;

uniform float t1Ani;
uniform float t2Ani;
uniform float t3Ani;
uniform float t4Ani;
uniform float t5Ani;
uniform float t6Ani;
uniform float t7Ani;

attribute vec2 position;
attribute vec2 texCoord;

varying vec2 v_texCoord;

const float atAreaW = 96.0;
const float atAreaH = 128.0*7.0;
const float atAniOffset = 32.0*3.0;

void main()
{
	vec2 tex = texCoord;

	lowp float pred = float(tex.x <= atAreaW && tex.y <= atAreaH);

	highp int tileIndex = int(tex.y / 128.0) + 1;

	if ((tileIndex == 1 && t1Ani >= 1.0) ||
		(tileIndex == 2 && t2Ani >= 1.0) ||
		(tileIndex == 3 && t3Ani >= 1.0) ||
		(tileIndex == 4 && t4Ani >= 1.0) ||
		(tileIndex == 5 && t5Ani >= 1.0) ||
		(tileIndex == 6 && t6Ani >= 1.0) ||
		(tileIndex == 7 && t7Ani >= 1.0))
	tex.x += aniIndex * atAniOffset * pred;

	gl_Position = projMat * vec4(position + translation, 0, 1);

	v_texCoord = tex * texSizeInv;
}
