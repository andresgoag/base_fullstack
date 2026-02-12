# Implementation Plan: Update Django and Vite to Latest Versions

**Target Versions:**
- Django: 6.0.2 (current: >=5.2.3)
- Vite: 7.3.1 (current: ^6.3.5)

**Last Updated:** February 11, 2026

## Executive Summary

This plan outlines the strategy for upgrading Django from 5.2.3 to 6.0.2 and Vite from 6.3.5 to 7.3.1. Both upgrades are relatively straightforward with minimal breaking changes, but require careful attention to dependency compatibility, particularly for Django REST Framework ecosystem packages.

## Research Findings

### Django 6.0.2

**Release Date:** February 3, 2026
**Status:** Latest stable version with security fixes

**Key Changes:**
- Python 3.12 is now the minimum supported version (project uses 3.13, so compatible)
- Supports Python 3.12, 3.13, and 3.14
- Security fixes for SQL injection vulnerabilities and denial-of-service issues
- MariaDB 10.6+ is now minimum (PostgreSQL unaffected)
- Email API changes for undocumented properties

**Breaking Changes:**
1. `EmailMessage` and `EmailMultiAlternatives` undocumented properties removed (`mixed_subtype`, `alternative_subtype`, `encoding` with Charset objects)
2. Internal email implementation significantly changed - affects custom subclasses
3. Python 3.12 minimum requirement may affect some dependencies

**Migration Notes:**
- Third-party packages should support Django 5.2+ as minimum
- Review deprecation timeline from 5.2 to 6.0
- No email customization detected in current codebase (low impact)

**Sources:**
- [Django 6.0 release notes](https://docs.djangoproject.com/en/6.0/releases/6.0/)
- [Django 6.0.2 release notes](https://docs.djangoproject.com/en/6.0/releases/6.0.2/)
- [Django security releases announcement](https://www.djangoproject.com/weblog/2026/feb/03/security-releases/)

### Vite 7.3.1

**Release Date:** Approximately January 2026
**Status:** Latest stable version

**Key Changes:**
- Node.js 18 support dropped (project uses Node 22 in Docker, so compatible)
- Default browser target updated to 'baseline-widely-available' (2026-01-01 standards)
- Sass legacy API support removed
- `splitVendorChunkPlugin` removed (deprecated since v5.2.7)

**Breaking Changes:**
1. `splitVendorChunkPlugin` removed - use `build.rollupOptions.output.manualChunks` instead
2. `transformIndexHtml` hook changed - use `order` instead of `enforce`, `handler` instead of `transform`
3. Several unused properties removed from internal APIs
4. Node.js v18 no longer supported

**Migration Notes:**
- Project doesn't use `splitVendorChunkPlugin` (no impact)
- Vite config is minimal, no custom `transformIndexHtml` hooks (no impact)
- SCSS preprocessor options are configured (should continue working)
- @vitejs/plugin-react v5 is fully compatible with Vite 7

**Sources:**
- [Vite 7.0 announcement](https://vite.dev/blog/announcing-vite7)
- [Vite migration guide](https://vite.dev/guide/migration)
- [@vitejs/plugin-react compatibility](https://github.com/vitejs/vite-plugin-react)

## Dependency Compatibility Analysis

### Backend Dependencies

| Package | Current Version | Django 6.0 Status | Action Required |
|---------|----------------|-------------------|-----------------|
| djangorestframework | >=3.16.0 | Officially supports up to 5.2; 6.0 compatibility unconfirmed | Monitor for updates; likely compatible |
| djangorestframework-simplejwt | >=5.5.0 | Should be compatible; part of Jazzband | Test thoroughly |
| djoser | >=2.3.1 | Compatibility unconfirmed | Test thoroughly; may need update |
| django-cors-headers | >=4.7.0 | Actively maintained; likely compatible | Test |
| django-environ | >=0.12.0 | Low-level utility; likely compatible | Test |
| psycopg2-binary | >=2.9.10 | PostgreSQL driver; Python 3.13 compatible | No change needed |
| pytest-django | >=4.11.1 | Test framework; likely compatible | Test |

**Risk Assessment:**
- **Medium Risk:** Django REST Framework, Djoser, and SimpleJWT may not have explicit Django 6.0 support yet
- **Low Risk:** Other utilities and database drivers are typically version-agnostic
- **Mitigation:** Run full test suite; check GitHub issues for compatibility reports

### Frontend Dependencies

| Package | Current Version | Vite 7 Status | Action Required |
|---------|----------------|---------------|-----------------|
| @vitejs/plugin-react | ^4.4.1 | Should update to 5.1.4 | Update to latest v5 |
| vite-tsconfig-paths | ^5.1.4 | Check Vite 7 compatibility | Test; likely compatible |
| sass | ^1.89.0 | Compatible (Sass legacy API removed but modern API fine) | No change needed |
| typescript | ~5.8.3 | Compatible | No change needed |
| All other deps | Various | Vite-agnostic (React, Router, etc.) | No impact |

**Risk Assessment:**
- **Low Risk:** @vitejs/plugin-react has confirmed Vite 7 compatibility
- **Low Risk:** Other dependencies are React/TypeScript libraries, not Vite-specific
- **Mitigation:** Update @vitejs/plugin-react to v5; test dev and build processes

## Implementation Strategy

### Phase 1: Preparation and Backup

1. **Create feature branch**
   ```bash
   git checkout -b feature/update-django-vite
   ```

2. **Document current state**
   - Capture current dependency versions from `uv.lock` and `bun.lockb`
   - Run test suite to establish baseline (if tests exist)
   - Test all critical user flows manually

3. **Review changelog details**
   - Read full Django 6.0 release notes
   - Read full Vite 7.0 migration guide
   - Identify any project-specific impacts

### Phase 2: Backend Updates

1. **Update Django version constraint**
   - File: `/Users/andresgoag/code/base_fullstack/backend/pyproject.toml`
   - Change: `"django>=5.2.3"` → `"django>=6.0.2"`

2. **Run dependency resolution**
   ```bash
   cd /Users/andresgoag/code/base_fullstack/backend
   uv sync
   ```

3. **Check for dependency conflicts**
   - If conflicts arise with DRF/Djoser, research available updates
   - Document any packages that need version bumps
   - Consider temporarily relaxing constraints if needed for compatibility testing

4. **Update Docker image**
   - Backend Dockerfile already uses Python 3.13-slim (compatible)
   - Rebuild image: `docker compose build backend`

5. **Run database migrations**
   ```bash
   docker compose exec backend uv run manage.py makemigrations
   docker compose exec backend uv run manage.py migrate
   ```

6. **Test backend**
   - Run pytest suite: `docker compose exec backend uv run pytest`
   - Test authentication endpoints manually (register, login, token refresh)
   - Verify CORS configuration still works
   - Check Django admin interface

### Phase 3: Frontend Updates

1. **Update Vite and related packages**
   - File: `/Users/andresgoag/code/base_fullstack/frontend/package.json`
   - Changes:
     - `"vite": "^6.3.5"` → `"vite": "^7.3.1"`
     - `"@vitejs/plugin-react": "^4.4.1"` → `"@vitejs/plugin-react": "^5.1.4"`

2. **Review vite.config.ts**
   - File: `/Users/andresgoag/code/base_fullstack/frontend/vite.config.ts`
   - No changes expected (config is minimal and uses standard patterns)
   - SCSS deprecation silencing is modern API compatible

3. **Install dependencies**
   ```bash
   cd /Users/andresgoag/code/base_fullstack/frontend
   bun install
   ```

4. **Update Docker image**
   - Frontend Dockerfile.dev uses Node 22 (compatible)
   - Note: Dockerfile.dev still uses npm/npm ci - consider updating to bun
   - Rebuild image: `docker compose build frontend`

5. **Test frontend**
   - Start dev server: `docker compose up frontend`
   - Verify hot module replacement works
   - Test production build: `bun run build`
   - Check bundle size and build warnings
   - Test SCSS compilation
   - Verify all routes and protected routes work

### Phase 4: Integration Testing

1. **Full stack testing**
   - Start all services: `docker compose up --build`
   - Test complete authentication flow:
     - User registration
     - User login
     - Token refresh mechanism
     - Protected route access
   - Verify API communication (check browser network tab)
   - Test CORS configuration
   - Verify environment variables are properly loaded

2. **Browser compatibility**
   - Test in multiple browsers (Chrome, Firefox, Safari)
   - Verify baseline-widely-available targets work as expected

3. **Performance validation**
   - Compare dev server startup time
   - Compare production build time
   - Check bundle sizes (should be similar or smaller)

### Phase 5: Documentation and Cleanup

1. **Update documentation**
   - File: `/Users/andresgoag/code/base_fullstack/CLAUDE.md`
   - Update version numbers in "Architecture" section
   - Note any new compatibility requirements

2. **Update lock files**
   - Commit updated `uv.lock`
   - Commit updated `bun.lockb` (via bun install)

3. **Document breaking changes**
   - Create or update CHANGELOG.md if it exists
   - Note any behavioral changes discovered during testing

4. **Clean up**
   - Remove old Docker volumes if needed: `docker compose down -v`
   - Rebuild fresh: `docker compose up --build`
   - Final verification test

## Testing Strategy

### Automated Testing

1. **Backend Tests**
   - Run full pytest suite: `uv run pytest`
   - Target: 100% of existing tests pass
   - Focus areas:
     - Authentication endpoints
     - JWT token generation and validation
     - Database operations
     - Any custom serializers

2. **Frontend Tests**
   - Currently no test files detected
   - Consider adding smoke tests for critical paths
   - If tests exist later, run: `bun run test`

### Manual Testing Checklist

**Authentication Flow:**
- [ ] User registration with valid data
- [ ] User registration with invalid data (error handling)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] Token refresh before expiration
- [ ] Token refresh after expiration
- [ ] Access protected routes with valid token
- [ ] Access protected routes without token (redirect to login)
- [ ] Logout functionality

**API Communication:**
- [ ] CORS headers present in responses
- [ ] Authorization headers sent correctly
- [ ] Token refresh on 401 errors
- [ ] Error handling for network failures

**Frontend Features:**
- [ ] All routes render correctly
- [ ] Navigation works (MainNavbar)
- [ ] Protected route guards work
- [ ] Toast notifications display
- [ ] React Query caching works
- [ ] Form validation (React Hook Form)

**Development Experience:**
- [ ] Hot module replacement works
- [ ] Dev server starts without errors
- [ ] No console errors in browser
- [ ] TypeScript compilation succeeds
- [ ] Linting passes: `bun run lint`
- [ ] Production build succeeds: `bun run build`

**Docker Environment:**
- [ ] All services start correctly
- [ ] Health checks pass
- [ ] Volume mounts work
- [ ] PostgreSQL connection succeeds
- [ ] Environment variables load correctly

## Rollback Plan

If critical issues are discovered:

1. **Immediate rollback**
   ```bash
   git checkout main
   docker compose down -v
   docker compose up --build
   ```

2. **Partial rollback options**
   - Revert Django only: Restore `pyproject.toml`, run `uv sync`
   - Revert Vite only: Restore `package.json`, run `bun install`

3. **Investigate and iterate**
   - Document the issue
   - Check GitHub issues for known problems
   - Consider alternative versions (e.g., Django 5.2.11 instead of 6.0.2)

## Potential Issues and Mitigations

### Issue 1: Django REST Framework Compatibility

**Symptom:** Import errors or deprecation warnings from DRF
**Likelihood:** Medium
**Mitigation:**
- Check DRF GitHub for Django 6.0 compatibility PRs
- Consider updating DRF to a newer version if available
- Worst case: Stay on Django 5.2.11 (latest 5.2.x with security fixes)

### Issue 2: Djoser/SimpleJWT Compatibility

**Symptom:** Authentication endpoints fail or return errors
**Likelihood:** Low to Medium
**Mitigation:**
- Test token creation and validation thoroughly
- Check for updates to djoser and djangorestframework-simplejwt
- Review Djoser GitHub issues for Django 6.0 reports
- Consider alternative: dj-rest-auth (if switching is necessary)

### Issue 3: Vite Build Configuration Issues

**Symptom:** Build warnings or errors with SCSS
**Likelihood:** Low
**Mitigation:**
- Vite 7 still supports modern Sass API
- Current deprecation silencing should continue working
- If issues arise, check sass and vite-sass plugin updates

### Issue 4: TypeScript Compilation Errors

**Symptom:** Type errors with Vite 7 or @vitejs/plugin-react v5
**Likelihood:** Very Low
**Mitigation:**
- TypeScript 5.8.3 is current and compatible
- @vitejs/plugin-react v5 has stable types
- Update @types packages if needed

### Issue 5: Docker Build Cache Issues

**Symptom:** Old dependencies persist despite updates
**Likelihood:** Low
**Mitigation:**
- Use `docker compose build --no-cache` for clean builds
- Remove volumes: `docker compose down -v`
- Clear uv cache if needed: `uv cache clean`

## Configuration Changes Required

### Backend Configuration

**File:** `/Users/andresgoag/code/base_fullstack/backend/backend/settings.py`
- No changes expected
- URL references in comments will be outdated (5.2 → 6.0) but non-functional
- Consider updating URL references for documentation purposes

**File:** `/Users/andresgoag/code/base_fullstack/backend/pyproject.toml`
```toml
[project]
dependencies = [
    "django>=6.0.2",
    # ... rest unchanged unless specific updates needed
]
```

**File:** `/Users/andresgoag/code/base_fullstack/backend/backend/urls.py`
- No changes required
- Djoser URL patterns should remain compatible

### Frontend Configuration

**File:** `/Users/andresgoag/code/base_fullstack/frontend/package.json`
```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.4",
    "vite": "^7.3.1",
    // ... rest unchanged
  }
}
```

**File:** `/Users/andresgoag/code/base_fullstack/frontend/vite.config.ts`
- No changes required
- Current configuration is compatible with Vite 7

**File (Optional):** `/Users/andresgoag/code/base_fullstack/frontend/Dockerfile.dev`
```dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci  # Consider: corepack enable && corepack prepare bun@latest --activate && bun install
COPY . .
ENV HOST=0.0.0.0
```
- Consider migrating from npm to bun in Docker for consistency

### Environment Variables

**No changes required:**
- `.env` (backend): All settings remain the same
- `frontend/.env`: All settings remain the same
- `docker-compose.yml`: No version-specific configuration

## Timeline Estimate

- **Phase 1 (Preparation):** 30 minutes
- **Phase 2 (Backend Updates):** 1-2 hours (including testing)
- **Phase 3 (Frontend Updates):** 30-45 minutes (including testing)
- **Phase 4 (Integration Testing):** 1-2 hours (thorough manual testing)
- **Phase 5 (Documentation):** 30 minutes

**Total Estimated Time:** 4-6 hours

**Recommended Approach:** Allocate a full day for the upgrade to allow time for unexpected issues and thorough testing.

## Success Criteria

The upgrade is considered successful when:

1. All Docker services start without errors
2. Backend pytest suite passes (if tests exist)
3. All authentication endpoints work correctly
4. Frontend builds without errors or warnings
5. All routes and protected routes function properly
6. No console errors in browser
7. Token refresh mechanism works
8. CORS configuration is functional
9. Development workflow (HMR, linting) works
10. Production build completes successfully

## Post-Implementation

After successful upgrade:

1. **Monitor for issues**
   - Watch for any runtime errors in logs
   - Check for deprecation warnings
   - Monitor performance metrics

2. **Update dependencies regularly**
   - Subscribe to Django security announcements
   - Watch Vite release notes for future updates
   - Keep DRF ecosystem packages current

3. **Consider future improvements**
   - Add frontend testing (Vitest pairs well with Vite)
   - Expand backend test coverage
   - Update Dockerfile.dev to use bun consistently
   - Consider Django 5.2 LTS track for long-term stability

4. **Share learnings**
   - Document any issues encountered
   - Update team on new features available
   - Note any performance improvements

## Additional Resources

### Django 6.0 Resources
- [Django 6.0 Release Notes](https://docs.djangoproject.com/en/6.0/releases/6.0/)
- [How to Upgrade Django](https://docs.djangoproject.com/en/6.0/howto/upgrade-version/)
- [Django Migration Guide (Medium)](https://medium.com/@backendbyeli/django-6-0-new-features-breaking-changes-migration-path-394a68a2ae44)

### Vite 7 Resources
- [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7)
- [Vite Migration Guide](https://vite.dev/guide/migration)
- [Vite GitHub Releases](https://github.com/vitejs/vite/releases)
- [Vite Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)

### Package Compatibility
- [Django REST Framework Releases](https://github.com/encode/django-rest-framework/releases)
- [Djoser Documentation](https://djoser.readthedocs.io/en/latest/)
- [@vitejs/plugin-react GitHub](https://github.com/vitejs/vite-plugin-react)

---

## Critical Files for Implementation

The following files are most critical for implementing this upgrade plan:

- **/Users/andresgoag/code/base_fullstack/backend/pyproject.toml** - Primary backend dependency specification; must update Django version constraint from `>=5.2.3` to `>=6.0.2`

- **/Users/andresgoag/code/base_fullstack/frontend/package.json** - Primary frontend dependency specification; must update Vite from `^6.3.5` to `^7.3.1` and @vitejs/plugin-react from `^4.4.1` to `^5.1.4`

- **/Users/andresgoag/code/base_fullstack/docker-compose.yml** - Docker orchestration configuration; verify service configurations remain compatible after updates; may need to trigger rebuilds

- **/Users/andresgoag/code/base_fullstack/backend/backend/settings.py** - Django core configuration; verify no deprecated settings are used and update documentation URLs in comments from 5.2 to 6.0 references

- **/Users/andresgoag/code/base_fullstack/frontend/vite.config.ts** - Vite build configuration; validate that current SCSS preprocessor options and plugin usage remain compatible with Vite 7 (should be compatible as-is)
