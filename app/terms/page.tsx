import React from 'react';

export const metadata = {
  title: 'LuminSight - 이용약관',
  description: 'LuminSight 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div style={{ background: '#f5f4fa', minHeight: '100vh', padding: '40px 0' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '40px', paddingBottom: '40px' }}>
        <h1 style={{ color: '#18162a', fontWeight: 800, fontSize: '32px', marginBottom: '32px' }}>
          이용약관
        </h1>

        <div style={{ fontSize: '14px', color: '#8b7fd4', marginBottom: '32px' }}>
          시행일: 2026년 3월 1일
        </div>

        {/* 제1조 서비스 목적 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제1조 서비스 목적
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              LuminSight(이하 "서비스")는 투자 관련 정보를 제공하는 플랫폼입니다. 본 서비스는 사용자가 다양한 투자 관련 데이터와 시장 정보에 접근할 수 있도록 하기 위함입니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              <span style={{ color: '#8b7fd4', fontWeight: 700 }}>중요:</span> LuminSight는 투자 조언, 투자 권유, 또는 금융 자문을 제공하지 않습니다. 본 서비스를 통해 제공되는 정보는 교육 목적으로만 제공되며, 사용자의 투자 결정의 기초로 사용되어서는 안 됩니다.
            </p>
          </div>
        </section>

        {/* 제2조 이용 자격 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제2조 이용 자격
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              본 서비스는 대한민국 법령상 성인(만 19세 이상)에 한하여 이용할 수 있습니다. 미성년자는 본 서비스에 가입하거나 이용할 수 없습니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              회원이 실명이 아닌 정보로 가입하거나 타인의 정보를 무단으로 이용하여 가입한 경우, 회사는 해당 회원의 가입을 취소할 수 있습니다.
            </p>
          </div>
        </section>

        {/* 제3조 금지 행위 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제3조 금지 행위
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '16px' }}>
              회원은 다음과 같은 행위를 하여서는 안 됩니다:
            </p>
            <ul style={{ color: '#5e5a78', lineHeight: 1.8, marginLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                자동화된 수집 도구, 로봇, 크롤러 등을 사용하여 서비스의 데이터를 무단으로 수집하는 행위
              </li>
              <li style={{ marginBottom: '8px' }}>
                서비스를 통해 획득한 정보의 상업적 재배포, 판매 또는 제3자에게 제공하는 행위
              </li>
              <li style={{ marginBottom: '8px' }}>
                불법적인 목적으로 서비스를 이용하거나 타인의 권리를 침해하는 행위
              </li>
              <li style={{ marginBottom: '8px' }}>
                서비스의 보안 시스템을 우회하거나 공격하는 행위
              </li>
              <li style={{ marginBottom: '8px' }}>
                허위, 공격적, 음란한, 또는 불법적인 콘텐츠를 게시하거나 전송하는 행위
              </li>
              <li style={{ marginBottom: '8px' }}>
                다른 사용자의 계정을 무단으로 사용하거나 접근하는 행위
              </li>
            </ul>
          </div>
        </section>

        {/* 제4조 면책 조항 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제4조 면책 조항
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              <span style={{ color: '#8b7fd4', fontWeight: 700 }}>손실에 대한 책임 부재:</span> 회사는 사용자가 본 서비스의 정보를 바탕으로 한 투자 결정으로 인해 발생하는 어떠한 손실, 손해, 또는 기회 상실에 대해 책임지지 않습니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              본 서비스는 "있는 그대로" 제공되며, 회사는 서비스의 정확성, 완전성, 또는 적시성을 보증하지 않습니다. 시장 데이터는 지연될 수 있으며, 실시간이 아닐 수 있습니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              회사는 서비스의 중단, 오류, 또는 제3자 서비스의 부정확성으로 인한 손실에 대해 책임지지 않습니다.
            </p>
          </div>
        </section>

        {/* 제5조 서비스 변경 및 중단 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제5조 서비스 변경 및 중단
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              회사는 사전 공지 없이 서비스의 일부 또는 전부를 변경, 중단, 또는 종료할 수 있습니다. 회사는 합리적인 범위 내에서 사전 공지를 하려고 노력합니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              서비스 중단으로 인한 손실 또는 손해에 대해 회사는 책임지지 않습니다.
            </p>
          </div>
        </section>

        {/* 제6조 준거법 및 관할 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제6조 준거법 및 관할
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8, marginBottom: '12px' }}>
              본 약관은 대한민국 법령에 따라 해석되고 관할됩니다.
            </p>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              본 서비스 이용과 관련하여 발생하는 분쟁은 대한민국 법원의 관할에 속합니다.
            </p>
          </div>
        </section>

        {/* 제7조 약관 변경 */}
        <section style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ color: '#18162a', fontWeight: 700, fontSize: '18px', marginBottom: '16px' }}>
            제7조 약관 변경
          </h2>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }}>
            <p style={{ color: '#5e5a78', lineHeight: 1.8 }}>
              회사는 필요에 따라 본 약관을 변경할 수 있으며, 변경 사항은 서비스 내에 공지됩니다. 변경된 약관에 동의하지 않는 경우 회원은 계정을 탈퇴할 수 있습니다.
            </p>
          </div>
        </section>

        <div style={{ borderTop: '1px solid #ece9f5', paddingTop: '32px', marginTop: '48px', textAlign: 'center' }}>
          <p style={{ color: '#a29bb0', fontSize: '14px', lineHeight: 1.8 }}>
            본 이용약관에 대한 문의사항은 support@luminsight.app으로 연락주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
