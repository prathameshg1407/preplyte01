import { Separator } from '@/components/ui/separator';
import type { ResumeProfileData, TemplateType } from '@/types/resume-builder.types';

interface TemplatePreviewProps {
  data: ResumeProfileData & { template?: TemplateType };
  customization?: {
    primaryColor?: string;
    fontFamily?: string;
    hiddenSections?: string[];
  };
}

export default function TemplatePreview({ 
  data, 
  customization = {} 
}: TemplatePreviewProps) {
  const { 
    fullName, 
    email, 
    phone, 
    headline,
    summary,
    address,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    education, 
    experience, 
    projects, 
    skills,
    certifications,
    languages,
    achievements,
    template = 'modern',
  } = data;

  const primaryColor = customization.primaryColor || '#2b6cb0';
  const fontFamily = customization.fontFamily || 'Helvetica';
  const hiddenSections = customization.hiddenSections || [];

  const isHidden = (section: string) => hiddenSections.includes(section);

  const containerStyle = {
    fontFamily: fontFamily,
  };

  const renderSocialLinks = () => {
    const links = [
      linkedinUrl && { label: 'LinkedIn', url: linkedinUrl },
      githubUrl && { label: 'GitHub', url: githubUrl },
      portfolioUrl && { label: 'Portfolio', url: portfolioUrl },
    ].filter((link): link is { label: string; url: string } => Boolean(link));
  
    if (links.length === 0) return null;
  
    return (
      <div className="text-sm mt-1">
        {links.map((link, idx) => (
          <span key={idx}>
            {idx > 0 && ' • '}
            <a href={link.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </span>
        ))}
      </div>
    );
  };

  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return (
          <div className="bg-white p-8" style={containerStyle}>
            <div className="border-l-4 pl-6 mb-6" style={{ borderColor: primaryColor }}>
              <h1 className="text-3xl font-bold mb-1" style={{ color: primaryColor }}>
                {fullName || 'Your Name'}
              </h1>
              {headline && (
                <p className="text-lg text-gray-600 mb-2">{headline}</p>
              )}
              <p className="text-sm text-gray-500">
                {email || 'email@example.com'} • {phone || 'Phone Number'}
                {address && ` • ${address}`}
              </p>
              {renderSocialLinks()}
            </div>
            {renderSections()}
          </div>
        );

      case 'minimal':
        return (
          <div className="bg-white p-8" style={containerStyle}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-light tracking-wider mb-2">
                {fullName || 'Your Name'}
              </h1>
              {headline && (
                <p className="text-sm text-gray-600 mb-1">{headline}</p>
              )}
              <p className="text-sm text-gray-600">
                {email || 'email@example.com'} | {phone || 'Phone Number'}
                {address && ` | ${address}`}
              </p>
              {renderSocialLinks()}
            </div>
            <Separator className="mb-6" />
            {renderSections()}
          </div>
        );

      case 'professional':
        return (
          <div className="bg-white p-8" style={containerStyle}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-serif mb-1">
                {fullName || 'Your Name'}
              </h1>
              {headline && (
                <p className="text-sm italic text-gray-600 mb-2">{headline}</p>
              )}
              <p className="text-sm">
                {email || 'email@example.com'} • {phone || 'Phone Number'}
                {address && ` • ${address}`}
              </p>
              {renderSocialLinks()}
            </div>
            <hr className="border-gray-800 mb-6" />
            {renderSections()}
          </div>
        );

      case 'creative':
        return (
          <div className="bg-gradient-to-br from-orange-50 to-white p-8" style={containerStyle}>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
                {fullName || 'Your Name'}
              </h1>
              {headline && (
                <p className="text-gray-700">{headline}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {email || 'email@example.com'} • {phone || 'Phone Number'}
                {address && ` • ${address}`}
              </p>
              {renderSocialLinks()}
            </div>
            {renderSections()}
          </div>
        );

      case 'corporate':
        return (
          <div className="bg-gray-50" style={containerStyle}>
            <div className="text-white p-6" style={{ backgroundColor: primaryColor }}>
              <h1 className="text-2xl font-bold uppercase tracking-wide">
                {fullName || 'Your Name'}
              </h1>
              {headline && (
                <p className="text-sm mt-1 opacity-90">{headline}</p>
              )}
            </div>
            <div className="p-8">
              <p className="text-sm text-gray-600 mb-2">
                {email || 'email@example.com'} • {phone || 'Phone Number'}
                {address && ` • ${address}`}
              </p>
              {renderSocialLinks()}
              <div className="mt-6">
                {renderSections()}
              </div>
            </div>
          </div>
        );

      case 'elegant':
        return (
          <div className="bg-white p-8" style={containerStyle}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light tracking-[0.2em] mb-2">
                {(fullName || 'Your Name').toUpperCase()}
              </h1>
              {headline && (
                <p className="text-sm text-gray-600 tracking-wider">{headline}</p>
              )}
              <div className="flex justify-center items-center gap-4 mt-3 text-sm flex-wrap">
                <span>{email || 'email@example.com'}</span>
                <span>•</span>
                <span>{phone || 'Phone Number'}</span>
                {address && (
                  <>
                    <span>•</span>
                    <span>{address}</span>
                  </>
                )}
              </div>
              {renderSocialLinks()}
            </div>
            <div className="border-t border-b border-gray-300 py-1 mb-6"></div>
            {renderSections()}
          </div>
        );

      default:
        return (
          <div className="bg-white p-8" style={containerStyle}>
            <div className="text-center py-12">
              <p className="text-gray-500">Template "{template}" not found</p>
            </div>
          </div>
        );
    }
  };

  const renderSections = () => (
    <div className="space-y-6">
      {!isHidden('summary') && summary && (
        <div>
          <h2 className="text-lg font-semibold mb-2 uppercase tracking-wide" style={{ color: primaryColor }}>
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {!isHidden('experience') && experience && experience.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900">{exp.role}</h3>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {exp.company}
                  {exp.location && ` • ${exp.location}`}
                </p>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-700 space-y-1">
                    {exp.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHidden('education') && education && education.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {edu.degree} in {edu.field}
                  </h3>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                {edu.grade && (
                  <p className="text-sm text-gray-600">GPA: {edu.grade}</p>
                )}
                {edu.description && (
                  <p className="text-sm text-gray-700 mt-1">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHidden('skills') && skills && skills.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2 uppercase tracking-wide" style={{ color: primaryColor }}>
            Skills
          </h2>
          <p className="text-sm text-gray-700">{skills.join(' • ')}</p>
        </div>
      )}

      {!isHidden('projects') && projects && projects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                {project.duration && (
                  <p className="text-sm text-gray-600">{project.duration}</p>
                )}
                <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Technologies:</span> {project.technologies.join(', ')}
                  </p>
                )}
                {project.link && (
                  <a 
                    href={project.link} 
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHidden('certifications') && certifications && certifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Certifications
          </h2>
          <div className="space-y-2">
            {certifications.map((cert, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {cert.date}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{cert.issuer}</p>
                {cert.verificationUrl && (
                  <a 
                    href={cert.verificationUrl} 
                    className="text-sm text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Verify Certificate →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHidden('languages') && languages && languages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2 uppercase tracking-wide" style={{ color: primaryColor }}>
            Languages
          </h2>
          <p className="text-sm text-gray-700">{languages.join(' • ')}</p>
        </div>
      )}

      {!isHidden('achievements') && achievements && achievements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Achievements
          </h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {achievements.map((achievement, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full overflow-auto bg-gray-100 p-4">
      <div className="max-w-[21cm] mx-auto shadow-lg">
        {renderTemplate()}
      </div>
    </div>
  );
}